import { MongoClient } from "mongodb";

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { client: null, db: null };
}

async function ensureIndexes(db) {
  try {
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('orders').createIndex({ clientOrderId: 1 }, { sparse: true, unique: true });
    await db.collection('products').createIndex({ categoryId: 1 });
    await db.collection('cart').createIndex({ userId: 1 }, { unique: true });
    await db.collection('wishlist').createIndex({ userId: 1 }, { unique: true });
    await db.collection('reviews').createIndex({ productId: 1, isDeleted: 1, createdAt: -1 });
    await db.collection('reviews').createIndex({ userId: 1, isDeleted: 1 });
    await db.collection('reviews').createIndex({ userId: 1, productId: 1 });
  } catch (err) {
    // Non-fatal — log and continue
    console.warn('[mongodb] Index creation warning:', err.message);
  }
}

export async function getDb() {
  if (cached.db) return cached.db;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing");
  }

  const client = new MongoClient(process.env.MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();

  const db = client.db("thunderbold");

  cached.client = client;
  cached.db = db;

  // Create indexes asynchronously — don't block the first request
  ensureIndexes(db);

  return db;
}
