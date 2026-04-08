import { MongoClient } from "mongodb";

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { client: null, db: null };
}

export async function getDb() {
  if (cached.db) return cached.db;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing");
  }

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  const db = client.db("thunderbold");

  cached.client = client;
  cached.db = db;

  return db;
}
