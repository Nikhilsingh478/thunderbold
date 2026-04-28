/**
 * Consolidated /api/orders handler.
 *
 * Sub-routes (works in both Express and Vercel):
 *   GET    /api/orders                — list orders (own; all for admin)
 *   POST   /api/orders/create         — create new order
 *   PUT    /api/orders/cancel         — cancel order (own; admin can cancel any)
 *   PATCH  /api/orders/manage?id=...  — admin update order status
 *   DELETE /api/orders/manage?id=...  — admin delete order
 *
 * Why one file? Vercel Hobby caps at 12 serverless functions; collapsing
 * the four order endpoints into one keeps headroom for future routes.
 */
import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isAdmin } from "../_lib/adminHelper.js";
import { isRateLimited } from "../_lib/rateLimit.js";

// ─────────────────────────── Helpers ─────────────────────────────────────────

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

async function authUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return { error: "Unauthorized", status: 401 };
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return { error: "Unauthorized", status: 401 };
    return { email: decoded.email };
  } catch {
    return { error: "Unauthorized", status: 401 };
  }
}

function resolveSubRoute(req) {
  // Vercel rewrites pass the sub-path as ?subpath=...
  const fromQuery = (req.query && req.query.subpath) || "";
  // Express mount strips /api/orders so req.url starts with the sub-route.
  const fromPath = (req.url || "/").split("?")[0].replace(/^\/+|\/+$/g, "");
  return String(fromQuery || fromPath || "").replace(/^\/+|\/+$/g, "");
}

// ─────────────────────────── GET (list) ──────────────────────────────────────

async function handleList(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });

  const db = await getDb();
  const ordersCollection = db.collection("orders");
  const adminUser = await isAdmin(user.email, db);
  const query = adminUser ? {} : { userId: user.email };
  const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();
  return res.status(200).json({ orders, count: orders.length });
}

// ─────────────────────────── POST /create ────────────────────────────────────

async function handleCreate(req, res) {
  if (isRateLimited(req)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });
  const userId = user.email;

  const db = await getDb();
  const ordersCollection = db.collection("orders");
  const productsCollection = db.collection("products");

  const body = await parseBody(req);
  const { products, address, paymentMethod, clientOrderId } = body;

  // Idempotency check
  if (clientOrderId) {
    const existing = await ordersCollection.findOne({ clientOrderId });
    if (existing) {
      return res.status(200).json({
        message: "Order already created",
        orderId: existing._id,
        order: existing,
      });
    }
  }

  // Validation
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Products are required" });
  }
  if (!address || !address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
    return res.status(400).json({ error: "Complete address is required" });
  }
  if (!paymentMethod) {
    return res.status(400).json({ error: "Payment method is required" });
  }

  const validProducts = products.every((p) =>
    p.productId && p.name &&
    typeof p.price === "number" &&
    p.image && p.size &&
    typeof p.quantity === "number" && p.quantity > 0
  );
  if (!validProducts) {
    return res.status(400).json({ error: "Invalid product structure" });
  }

  // Pre-flight stock check
  const dbProductsMap = new Map();
  for (const item of products) {
    let dbProduct = null;
    try { dbProduct = await productsCollection.findOne({ _id: new ObjectId(item.productId) }); }
    catch { dbProduct = await productsCollection.findOne({ _id: item.productId }); }

    if (!dbProduct) return res.status(400).json({ error: `Product "${item.name}" not found` });
    dbProductsMap.set(item.productId, dbProduct);

    let available;
    if (dbProduct.sizeStock && typeof dbProduct.sizeStock === "object" && item.size in dbProduct.sizeStock) {
      available = dbProduct.sizeStock[item.size];
    } else {
      available = typeof dbProduct.stock === "number" ? dbProduct.stock : 0;
    }

    if (available < item.quantity) {
      return res.status(400).json({
        error: available === 0
          ? `"${item.name}" (size ${item.size}) is out of stock`
          : `Only ${available} unit(s) of "${item.name}" in size ${item.size} are available`,
      });
    }
  }

  // Create order
  const order = {
    userId,
    products,
    address,
    paymentMethod,
    status: "pending",
    createdAt: new Date(),
    totalAmount: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    ...(clientOrderId ? { clientOrderId } : {}),
  };

  let result;
  try {
    result = await ordersCollection.insertOne(order);
  } catch (insertError) {
    if (insertError.code === 11000 && clientOrderId) {
      const existing = await ordersCollection.findOne({ clientOrderId });
      if (existing) {
        return res.status(200).json({
          message: "Order already created",
          orderId: existing._id,
          order: existing,
        });
      }
    }
    throw insertError;
  }

  // Atomic stock decrement with compensation rollback
  const decremented = [];
  let stockError = null;

  for (const item of products) {
    let productObjectId;
    try { productObjectId = new ObjectId(item.productId); }
    catch { productObjectId = item.productId; }

    const dbProduct = dbProductsMap.get(item.productId);
    const hasSizeStock = dbProduct?.sizeStock && typeof dbProduct.sizeStock === "object" && item.size in dbProduct.sizeStock;

    const updateFilter = hasSizeStock
      ? { _id: productObjectId, [`sizeStock.${item.size}`]: { $gte: item.quantity } }
      : { _id: productObjectId, stock: { $gte: item.quantity } };

    const updateOp = hasSizeStock
      ? { $inc: { [`sizeStock.${item.size}`]: -item.quantity, stock: -item.quantity } }
      : { $inc: { stock: -item.quantity } };

    const updateResult = await productsCollection.updateOne(updateFilter, updateOp);

    if (updateResult.modifiedCount === 0) {
      stockError = `Stock changed for "${item.name}" (size ${item.size}) — please retry`;
      break;
    }

    decremented.push({ id: productObjectId, quantity: item.quantity, size: item.size, hasSizeStock });
  }

  if (stockError) {
    for (const prev of decremented) {
      const restoreOp = prev.hasSizeStock
        ? { $inc: { [`sizeStock.${prev.size}`]: prev.quantity, stock: prev.quantity } }
        : { $inc: { stock: prev.quantity } };
      await productsCollection.updateOne({ _id: prev.id }, restoreOp);
    }
    await ordersCollection.deleteOne({ _id: result.insertedId });
    return res.status(409).json({ error: stockError });
  }

  return res.status(201).json({
    message: "Order created successfully",
    orderId: result.insertedId,
    order,
  });
}

// ─────────────────────────── PUT /cancel ─────────────────────────────────────

async function handleCancel(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });
  const userEmail = user.email;

  const body = await parseBody(req);
  const { orderId } = body;
  if (!orderId) return res.status(400).json({ error: "Order ID is required" });

  const db = await getDb();
  const ordersCollection = db.collection("orders");
  const productsCollection = db.collection("products");

  let orderObjectId;
  try { orderObjectId = new ObjectId(orderId); }
  catch { return res.status(400).json({ error: "Invalid order ID format" }); }

  const order = await ordersCollection.findOne({ _id: orderObjectId });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.userId !== userEmail && !(await isAdmin(userEmail, db))) {
    return res.status(403).json({ error: "You can only cancel your own orders" });
  }
  if (order.status === "cancelled") return res.status(400).json({ error: "Order is already cancelled" });
  if (order.status === "delivered") return res.status(400).json({ error: "Delivered orders cannot be cancelled" });

  const result = await ordersCollection.updateOne(
    { _id: orderObjectId },
    { $set: { status: "cancelled", updatedAt: new Date() } }
  );
  if (result.modifiedCount === 0) return res.status(400).json({ error: "Order could not be cancelled" });

  // Restore stock for each item (size-aware)
  const orderProducts = order.products || [];
  for (const item of orderProducts) {
    if (!item.productId || !item.quantity) continue;
    try {
      let productObjectId;
      try { productObjectId = new ObjectId(item.productId); }
      catch { productObjectId = item.productId; }

      const dbProduct = await productsCollection.findOne({ _id: productObjectId });
      const hasSizeStock = dbProduct?.sizeStock && typeof dbProduct.sizeStock === "object" && item.size in dbProduct.sizeStock;

      const restoreOp = hasSizeStock
        ? { $inc: { [`sizeStock.${item.size}`]: item.quantity, stock: item.quantity } }
        : { $inc: { stock: item.quantity } };

      await productsCollection.updateOne({ _id: productObjectId }, restoreOp);
    } catch (err) {
      console.error("ORDER CANCEL: Failed to restore stock for:", item.productId, err.message);
    }
  }

  return res.status(200).json({ success: true, message: "Order cancelled successfully", orderId });
}

// ─────────────────────────── PATCH/DELETE /manage ────────────────────────────

async function handleManage(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });

  const db = await getDb();
  if (!(await isAdmin(user.email, db))) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const orderId = req.query.id;
  if (!orderId) return res.status(400).json({ error: "Order ID is required" });

  let objectId;
  try { objectId = new ObjectId(orderId); }
  catch { return res.status(400).json({ error: "Invalid order ID format" }); }

  const orders = db.collection("orders");

  if (req.method === "PATCH") {
    const body = await parseBody(req);
    const { status } = body;
    const validStatuses = ["pending", "confirmed", "shipped", "delivered"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Valid: pending, confirmed, shipped, delivered" });
    }
    const result = await orders.updateOne(
      { _id: objectId },
      { $set: { status, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Order not found" });
    return res.status(200).json({ message: "Status updated", orderId, newStatus: status });
  }

  if (req.method === "DELETE") {
    const result = await orders.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Order not found" });
    return res.status(200).json({ message: "Order deleted", orderId });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}

// ─────────────────────────── Dispatcher ──────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sub = resolveSubRoute(req);

  try {
    // Sub-routed actions
    if (sub === "create") {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
      return await handleCreate(req, res);
    }

    if (sub === "cancel") {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
      return await handleCancel(req, res);
    }

    if (sub === "manage") {
      if (req.method !== "PATCH" && req.method !== "DELETE") {
        res.setHeader("Allow", ["PATCH", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
      return await handleManage(req, res);
    }

    // Default: list orders (sub === "" or unknown)
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }
    return await handleList(req, res);
  } catch (error) {
    console.error("ORDERS API ERROR:", error.message, error.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
}
