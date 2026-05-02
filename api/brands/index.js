import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isAdmin } from "../_lib/adminHelper.js";

async function checkAdminAuth(req, database) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return { authorized: false, error: "Unauthorized" };
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return { authorized: false, error: "Unauthorized" };
    const admin = await isAdmin(decoded.email, database);
    if (!admin) return { authorized: false, error: "Admin access required" };
    return { authorized: true };
  } catch {
    return { authorized: false, error: "Unauthorized" };
  }
}

function parseId(raw) {
  try {
    return new ObjectId(String(raw));
  } catch {
    return raw;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  let db;
  try {
    db = await getDb();
  } catch (err) {
    console.error("BRANDS API ERROR (db):", err.message);
    return res.status(500).json({ error: "Database unavailable" });
  }

  const col = db.collection("brands");
  const id = req.query?.id;

  try {
    switch (req.method) {
      case "GET": {
        const brands = await col
          .find({}, { projection: { name: 1, createdAt: 1 } })
          .sort({ name: 1 })
          .toArray();
        return res.status(200).json({ brands, count: brands.length });
      }

      case "POST": {
        const auth = await checkAdminAuth(req, db);
        if (!auth.authorized)
          return res
            .status(auth.error === "Unauthorized" ? 401 : 403)
            .json({ error: auth.error });

        const name = (req.body?.name || "").trim();
        if (!name)
          return res.status(400).json({ error: "Brand name is required" });

        const existing = await col.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
        if (existing)
          return res.status(409).json({ error: "A brand with this name already exists" });

        const doc = { name, createdAt: new Date() };
        const result = await col.insertOne(doc);
        return res
          .status(201)
          .json({ message: "Brand created", brand: { _id: result.insertedId, ...doc } });
      }

      case "PUT": {
        if (!id) return res.status(400).json({ error: "Brand ID is required" });

        const auth = await checkAdminAuth(req, db);
        if (!auth.authorized)
          return res
            .status(auth.error === "Unauthorized" ? 401 : 403)
            .json({ error: auth.error });

        const name = (req.body?.name || "").trim();
        if (!name)
          return res.status(400).json({ error: "Brand name is required" });

        const result = await col.findOneAndUpdate(
          { _id: parseId(id) },
          { $set: { name, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
        const updated = result?.value ?? result;
        if (!updated) return res.status(404).json({ error: "Brand not found" });
        return res.status(200).json({ message: "Brand updated", brand: updated });
      }

      case "DELETE": {
        if (!id) return res.status(400).json({ error: "Brand ID is required" });

        const auth = await checkAdminAuth(req, db);
        if (!auth.authorized)
          return res
            .status(auth.error === "Unauthorized" ? 401 : 403)
            .json({ error: auth.error });

        const result = await col.deleteOne({ _id: parseId(id) });
        if (result.deletedCount === 0)
          return res.status(404).json({ error: "Brand not found" });
        return res.status(200).json({ success: true, message: "Brand deleted" });
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("BRANDS API ERROR:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
