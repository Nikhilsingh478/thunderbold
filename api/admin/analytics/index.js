import { getDb } from "../../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../../_lib/firebaseAdmin.js";
import { isAdmin } from "../../_lib/adminHelper.js";

async function checkAdminAuth(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return { authorized: false, status: 401, error: "Unauthorized" };
    const admin = await isAdmin(decoded.email, db);
    if (!admin) return { authorized: false, status: 403, error: "Admin access required" };
    return { authorized: true };
  } catch {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }
}

function asDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Build the date $match stage. Defaults to last 30 days when no range given.
 * Returns { match, from, to } where match is a Mongo match object.
 */
function buildDateRange(query) {
  const to = asDate(query.to) || new Date();
  const from = asDate(query.from) || new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  // Normalise to start/end of day (UTC) so the buckets line up cleanly.
  const fromStart = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const toEnd = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59, 999));
  return { from: fromStart, to: toEnd };
}

/** Returns YYYY-MM-DD strings between from and to inclusive (UTC). */
function eachDay(from, to) {
  const days = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Treat orders as cancelled if status is 'cancelled' (case-insensitive). */
const NON_REVENUE_STATUSES = ["cancelled", "canceled", "refunded"];
const revenueOrderMatch = {
  $or: [
    { status: { $exists: false } },
    { status: { $nin: NON_REVENUE_STATUSES } },
  ],
};

async function getOverview(db, range) {
  const orders = db.collection("orders");
  const users = db.collection("users");

  const [revAgg, orderCount, userCount] = await Promise.all([
    orders
      .aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to }, ...revenueOrderMatch } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .toArray(),
    orders.countDocuments({ createdAt: { $gte: range.from, $lte: range.to } }),
    users.countDocuments(),
  ]);

  const totalRevenue = revAgg[0]?.total || 0;
  const totalOrders = orderCount || 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: aov,
    totalUsers: userCount || 0,
  };
}

async function getRevenueOverTime(db, range) {
  const orders = db.collection("orders");
  const rows = await orders
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to }, ...revenueOrderMatch } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ])
    .toArray();

  const map = new Map(rows.map((r) => [r._id, r.revenue]));
  return eachDay(range.from, range.to).map((date) => ({
    date,
    revenue: Math.round((map.get(date) || 0) * 100) / 100,
  }));
}

async function getOrdersOverTime(db, range) {
  const orders = db.collection("orders");
  const rows = await orders
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const map = new Map(rows.map((r) => [r._id, r.count]));
  return eachDay(range.from, range.to).map((date) => ({
    date,
    count: map.get(date) || 0,
  }));
}

async function getTopProducts(db, range, limit = 5) {
  const orders = db.collection("orders");
  const products = db.collection("products");

  // Aggregate units sold from order line items. Order schema stores
  // products as an embedded array on each order document.
  const rows = await orders
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to }, ...revenueOrderMatch } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: { $ifNull: ["$products.quantity", 1] } },
          // Fall back name/image taken from the line item snapshot in case
          // the underlying product was deleted.
          fallbackName: { $first: "$products.name" },
          fallbackImage: { $first: "$products.image" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ])
    .toArray();

  if (rows.length === 0) return [];

  const ids = rows
    .map((r) => r._id)
    .filter(Boolean)
    .map((id) => {
      try {
        return new ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const productDocs = ids.length
    ? await products
        .find(
          { _id: { $in: ids } },
          { projection: { name: 1, image: 1, images: 1, price: 1 } }
        )
        .toArray()
    : [];

  const productMap = new Map(productDocs.map((p) => [String(p._id), p]));

  return rows.map((r) => {
    const p = r._id ? productMap.get(String(r._id)) : null;
    const image =
      (p && (p.image || (Array.isArray(p.images) && p.images[0]))) || r.fallbackImage || null;
    return {
      productId: r._id ? String(r._id) : null,
      name: p?.name || r.fallbackName || "Unknown product",
      image,
      price: p?.price ?? null,
      totalSold: r.totalSold,
    };
  });
}

async function getStockAlerts(db, threshold = 5) {
  const products = db.collection("products");
  const docs = await products
    .find(
      { stock: { $lte: threshold } },
      { projection: { name: 1, image: 1, images: 1, stock: 1, sizeStock: 1, price: 1 } }
    )
    .sort({ stock: 1 })
    .limit(50)
    .toArray();

  const items = docs.map((p) => ({
    productId: String(p._id),
    name: p.name,
    image: p.image || (Array.isArray(p.images) ? p.images[0] : null),
    stock: typeof p.stock === "number" ? p.stock : 0,
    sizeStock: p.sizeStock || null,
    price: p.price ?? null,
  }));

  return {
    threshold,
    outOfStock: items.filter((i) => i.stock === 0),
    lowStock: items.filter((i) => i.stock > 0 && i.stock <= threshold),
  };
}

async function getRecentOrders(db, limit = 5) {
  const orders = db.collection("orders");
  const docs = await orders
    .find(
      {},
      {
        projection: {
          userId: 1,
          totalAmount: 1,
          status: 1,
          createdAt: 1,
          "address.fullName": 1,
          products: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((o) => ({
    _id: String(o._id),
    userId: o.userId || null,
    customer: o.address?.fullName || o.userId || "—",
    totalAmount: o.totalAmount || 0,
    status: o.status || "pending",
    createdAt: o.createdAt,
    itemCount: Array.isArray(o.products)
      ? o.products.reduce((s, p) => s + (Number(p.quantity) || 1), 0)
      : 0,
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let db;
  try {
    db = await getDb();
  } catch (err) {
    console.error("ANALYTICS API ERROR (db):", err.message);
    return res.status(500).json({ error: "Database unavailable" });
  }

  const auth = await checkAdminAuth(req, db);
  if (!auth.authorized) return res.status(auth.status).json({ error: auth.error });

  // Sub-route is whatever path remains after the /api/admin/analytics mount.
  // e.g. req.url === '/' or '/overview' or '/revenue?from=...'
  const rawPath = (req.url || "/").split("?")[0];
  const sub = rawPath.replace(/^\/+|\/+$/g, "") || "all";
  const range = buildDateRange(req.query || {});

  try {
    switch (sub) {
      case "overview":
        return res.status(200).json({ ...(await getOverview(db, range)), range });

      case "revenue":
        return res.status(200).json({ data: await getRevenueOverTime(db, range), range });

      case "orders":
        return res.status(200).json({ data: await getOrdersOverTime(db, range), range });

      case "top-products":
        return res.status(200).json({ data: await getTopProducts(db, range) });

      case "stock-alerts":
        return res.status(200).json(await getStockAlerts(db));

      case "recent-orders":
        return res.status(200).json({ data: await getRecentOrders(db) });

      case "all":
      default: {
        // Run every aggregation in parallel — single round trip from the client.
        const [overview, revenue, ordersTs, topProducts, stockAlerts, recentOrders] =
          await Promise.all([
            getOverview(db, range),
            getRevenueOverTime(db, range),
            getOrdersOverTime(db, range),
            getTopProducts(db, range),
            getStockAlerts(db),
            getRecentOrders(db),
          ]);
        return res.status(200).json({
          range,
          overview,
          revenueSeries: revenue,
          ordersSeries: ordersTs,
          topProducts,
          stockAlerts,
          recentOrders,
        });
      }
    }
  } catch (err) {
    console.error("ANALYTICS API ERROR:", err.message, err.stack);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}
