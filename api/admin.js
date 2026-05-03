import { getDb } from "./_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "./_lib/firebaseAdmin.js";
import { isAdmin } from "./_lib/adminHelper.js";

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

/** Treat orders as cancelled if status is 'cancelled' (case-insensitive). */
const NON_REVENUE_STATUSES = ["cancelled", "canceled", "refunded"];
const revenueOrderMatch = {
  $or: [
    { status: { $exists: false } },
    { status: { $nin: NON_REVENUE_STATUSES } },
  ],
};

/**
 * Build a 12-month window ending on the current month.
 * Returns { from, to } as Date objects (UTC month boundaries).
 */
function buildMonthRange() {
  const now = new Date();
  // End: last moment of the current month (UTC)
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  // Start: first moment of the month 11 months ago (12 months total)
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  return { from, to };
}

/**
 * Return an array of "YYYY-MM" strings spanning every month
 * from `from` to `to` inclusive (UTC).
 */
function eachMonth(from, to) {
  const months = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

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

function buildRange(mode = "month") {
  const now = new Date();
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  if (mode === "7d") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
    return { from, to: endOfToday, mode };
  }
  if (mode === "30d") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
    return { from, to: endOfToday, mode };
  }
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from, to, mode: "month" };
}

function buildSelectedMonthRange(selectedMonth) {
  const now = new Date();
  const fallbackMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-\d{2}$/.test(selectedMonth || "") ? selectedMonth : fallbackMonth;
  const [year, mon] = month.split("-");
  const from = new Date(Date.UTC(Number(year), Number(mon) - 1, 1));
  const to = new Date(Date.UTC(Number(year), Number(mon), 0, 23, 59, 59, 999));
  return { from, to, mode: "month", selectedMonth: month };
}

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
  if (range.mode === "month") {
    const rows = await orders
      .aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to }, ...revenueOrderMatch } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ])
      .toArray();
    const map = new Map(rows.map((r) => [r._id, r.revenue]));
    return eachMonth(range.from, range.to).map((month) => ({
      month,
      revenue: Math.round((map.get(month) || 0) * 100) / 100,
    }));
  }
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
  return eachDay(range.from, range.to).map((day) => ({
    day,
    revenue: Math.round((map.get(day) || 0) * 100) / 100,
  }));
}

async function getOrdersOverTime(db, range) {
  const orders = db.collection("orders");
  if (range.mode === "month") {
    const rows = await orders
      .aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();
    const map = new Map(rows.map((r) => [r._id, r.count]));
    return eachMonth(range.from, range.to).map((month) => ({
      month,
      count: map.get(month) || 0,
    }));
  }
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
  return eachDay(range.from, range.to).map((day) => ({
    day,
    count: map.get(day) || 0,
  }));
}

async function getTopProducts(db, range, limit = 5) {
  const orders = db.collection("orders");
  const products = db.collection("products");

  const rows = await orders
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to }, ...revenueOrderMatch } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: { $ifNull: ["$products.quantity", 1] } },
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
      try { return new ObjectId(String(id)); }
      catch { return null; }
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

  const mode = req.query.range === "7d" || req.query.range === "30d" ? req.query.range : "month";
  const range = req.query.month ? buildSelectedMonthRange(String(req.query.month)) : buildRange(mode);

  try {
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
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      selectedMonth: range.selectedMonth || null,
      overview,
      revenueSeries: revenue,
      ordersSeries: ordersTs,
      topProducts,
      stockAlerts,
      recentOrders,
    });
  } catch (err) {
    console.error("ANALYTICS API ERROR:", err.message, err.stack);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}
