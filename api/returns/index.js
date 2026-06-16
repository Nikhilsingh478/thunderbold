/**
 * /api/returns — Return request handler
 *
 * Sub-routes / methods:
 *   GET   /api/returns           — customer: own return requests; admin: all requests
 *   POST  /api/returns           — customer submits a return request (delivered orders only)
 *   PATCH /api/returns?id=...    — admin approves or rejects a return request
 *
 * Policy enforced here:
 *   - Return can only be raised for an order whose status is 'delivered'
 *   - One return request per order (idempotency)
 *   - Approve: sets refundAmount = totalAmount − SHIPPING_CHARGES, admin can override
 *   - Reject: stores adminNotes; no refund issued
 *   - On approve/reject: order status is updated to 'return_approved'/'return_rejected'
 */

import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isAdmin } from "../_lib/adminHelper.js";


const RETURN_REASONS = [
  'defective',
  'wrong_item',
  'size_issue',
  'not_as_described',
  'other',
];

// ─────────────────────────── Helpers ─────────────────────────────────────────

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
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

// ─────────────────────────── GET ─────────────────────────────────────────────

async function handleGet(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });

  const db = await getDb();
  const admin = await isAdmin(user.email, db);
  const query = admin ? {} : { userId: user.email };

  const returns = await db.collection("returns")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return res.status(200).json({ returns, count: returns.length });
}

// ─────────────────────────── POST (create request) ───────────────────────────

async function handleCreate(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });

  const db = await getDb();
  const body = await parseBody(req);
  const { orderId, reason, description } = body;

  // ── Validate inputs ────────────────────────────────────────────────────────
  if (!orderId) return res.status(400).json({ error: "Order ID is required" });
  if (!RETURN_REASONS.includes(reason)) {
    return res.status(400).json({ error: "Invalid reason. Choose: defective, wrong_item, size_issue, not_as_described, or other" });
  }
  const cleanDesc = typeof description === "string" ? description.replace(/<[^>]*>/g, "").trim().slice(0, 500) : "";
  if (cleanDesc.length < 10) {
    return res.status(400).json({ error: "Please provide a description (at least 10 characters)" });
  }

  // ── Fetch the order ────────────────────────────────────────────────────────
  let orderObjectId;
  try { orderObjectId = new ObjectId(orderId); }
  catch { return res.status(400).json({ error: "Invalid order ID format" }); }

  const order = await db.collection("orders").findOne({ _id: orderObjectId });
  if (!order) return res.status(404).json({ error: "Order not found" });

  // ── Ownership check ────────────────────────────────────────────────────────
  if (order.userId !== user.email) {
    return res.status(403).json({ error: "You can only return your own orders" });
  }

  // ── Policy: only delivered orders can be returned ──────────────────────────
  if (order.status !== "delivered") {
    return res.status(400).json({
      error: "Return requests can only be raised for delivered orders. Order status: " + order.status,
    });
  }

  // ── Idempotency: one return per order ──────────────────────────────────────
  const existing = await db.collection("returns").findOne({ orderId: orderId });
  if (existing) {
    return res.status(409).json({
      error: "A return request for this order already exists.",
      returnId: existing._id,
      status: existing.status,
    });
  }

  // ── Create return document ─────────────────────────────────────────────────
  const DEFAULT_SHIPPING = 50;
  const suggestedRefund = Math.max(0, (order.totalAmount || 0) - DEFAULT_SHIPPING);

  const returnDoc = {
    orderId: orderId,
    orderNumber: order.orderNumber || null,
    userId: user.email,
    products: order.products || [],
    totalAmount: order.totalAmount || 0,
    shippingCharges: DEFAULT_SHIPPING,
    suggestedRefundAmount: suggestedRefund,
    reason,
    description: cleanDesc,
    status: "pending",
    refundAmount: null,    // set by admin on approval
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("returns").insertOne(returnDoc);

  // ── Update order status to 'return_requested' ──────────────────────────────
  await db.collection("orders").updateOne(
    { _id: orderObjectId },
    { $set: { status: "return_requested", updatedAt: new Date() } }
  );

  return res.status(201).json({
    message: "Return request submitted successfully",
    returnId: result.insertedId,
    suggestedRefundAmount: suggestedRefund,
    shippingDeduction: SHIPPING_CHARGES,
  });
}

// ─────────────────────────── PATCH (admin manage) ────────────────────────────

async function handleManage(req, res) {
  const user = await authUser(req);
  if (user.error) return res.status(user.status).json({ error: user.error });

  const db = await getDb();
  if (!(await isAdmin(user.email, db))) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const returnId = req.query.id;
  if (!returnId) return res.status(400).json({ error: "Return ID is required" });

  let objectId;
  try { objectId = new ObjectId(returnId); }
  catch { return res.status(400).json({ error: "Invalid return ID format" }); }

  const returnDoc = await db.collection("returns").findOne({ _id: objectId });
  if (!returnDoc) return res.status(404).json({ error: "Return request not found" });

  const body = await parseBody(req);
  const { action, refundAmount, shippingCharges, adminNotes } = body;

  // ── Issue refund (after approval) ─────────────────────────────────────────
  if (action === "issue_refund") {
    if (returnDoc.status !== "approved") {
      return res.status(400).json({ error: "Return must be approved before issuing a refund" });
    }
    await db.collection("returns").updateOne(
      { _id: objectId },
      { $set: { status: "refund_issued", refundIssuedAt: new Date(), updatedAt: new Date() } }
    );
    let orderObjectId;
    try { orderObjectId = new ObjectId(returnDoc.orderId); }
    catch { orderObjectId = returnDoc.orderId; }
    await db.collection("orders").updateOne(
      { _id: orderObjectId },
      { $set: { status: "refund_issued", updatedAt: new Date() } }
    );
    return res.status(200).json({ message: "Refund marked as issued." });
  }

  if (returnDoc.status !== "pending") {
    return res.status(400).json({ error: `Return request is already ${returnDoc.status}` });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
  }

  const cleanNotes = typeof adminNotes === "string"
    ? adminNotes.replace(/<[^>]*>/g, "").trim().slice(0, 500)
    : "";

  if (action === "approve") {
    // Shipping cost: admin provides it; fall back to what was stored at request time
    const finalShipping = typeof shippingCharges === "number" && shippingCharges >= 0
      ? shippingCharges
      : returnDoc.shippingCharges;

    // Refund amount: admin can override, default = totalAmount − finalShipping
    const computedRefund = Math.max(0, (returnDoc.totalAmount || 0) - finalShipping);
    const finalRefund = typeof refundAmount === "number" && refundAmount >= 0
      ? refundAmount
      : computedRefund;

    await db.collection("returns").updateOne(
      { _id: objectId },
      {
        $set: {
          status: "approved",
          shippingCharges: finalShipping,
          refundAmount: finalRefund,
          adminNotes: cleanNotes || null,
          updatedAt: new Date(),
        },
      }
    );

    // Update order status + store refund details so the orders page can display them
    let orderObjectId;
    try { orderObjectId = new ObjectId(returnDoc.orderId); }
    catch { orderObjectId = returnDoc.orderId; }
    await db.collection("orders").updateOne(
      { _id: orderObjectId },
      { $set: { status: "return_approved", returnShippingCharges: finalShipping, returnRefundAmount: finalRefund, updatedAt: new Date() } }
    );

    // ── Restore stock for each item (size-aware) ─────────────────────────────
    const orderProducts = returnDoc.products || [];
    const productsCollection = db.collection("products");
    for (const item of orderProducts) {
      if (!item.productId || !item.quantity) continue;
      try {
        let productObjectId;
        try { productObjectId = new ObjectId(item.productId); }
        catch { productObjectId = item.productId; }

        const dbProduct = await productsCollection.findOne({ _id: productObjectId });
        if (!dbProduct) continue;

        const isOutfit = dbProduct.section === "outfits"
          && dbProduct.topwear && dbProduct.bottomwear
          && item.topwearSize && item.bottomwearSize;

        let restoreOp;
        if (isOutfit) {
          restoreOp = {
            $inc: {
              [`topwear.sizeStock.${item.topwearSize}`]: item.quantity,
              "topwear.stock": item.quantity,
              [`bottomwear.sizeStock.${item.bottomwearSize}`]: item.quantity,
              "bottomwear.stock": item.quantity,
              stock: item.quantity,
            },
          };
        } else {
          const hasSizeStock = dbProduct.sizeStock
            && typeof dbProduct.sizeStock === "object"
            && item.size in dbProduct.sizeStock;
          restoreOp = hasSizeStock
            ? { $inc: { [`sizeStock.${item.size}`]: item.quantity, stock: item.quantity } }
            : { $inc: { stock: item.quantity } };
        }

        await productsCollection.updateOne({ _id: productObjectId }, restoreOp);
      } catch (err) {
        console.error("RETURN APPROVE: Failed to restore stock for:", item.productId, err.message);
      }
    }

    return res.status(200).json({
      message: "Return approved. Refund of ₹" + finalRefund + " to be issued.",
      refundAmount: finalRefund,
    });
  }

  // action === 'reject'
  await db.collection("returns").updateOne(
    { _id: objectId },
    {
      $set: {
        status: "rejected",
        adminNotes: cleanNotes || null,
        updatedAt: new Date(),
      },
    }
  );

  let orderObjectId;
  try { orderObjectId = new ObjectId(returnDoc.orderId); }
  catch { orderObjectId = returnDoc.orderId; }
  await db.collection("orders").updateOne(
    { _id: orderObjectId },
    { $set: { status: "return_rejected", updatedAt: new Date() } }
  );

  return res.status(200).json({ message: "Return request rejected." });
}

// ─────────────────────────── Dispatcher ──────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET")   return await handleGet(req, res);
    if (req.method === "POST")  return await handleCreate(req, res);
    if (req.method === "PATCH") return await handleManage(req, res);

    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("RETURNS API ERROR:", err.message, err.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
}
