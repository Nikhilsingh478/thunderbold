import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "nikhilwebworks@gmail.com";

async function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { authorized: false, error: 'Unauthorized' };
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (decoded?.email !== ADMIN_EMAIL) return { authorized: false, error: 'Admin access required' };
    return { authorized: true, userEmail: decoded.email };
  } catch {
    return { authorized: false, error: 'Unauthorized' };
  }
}

function normaliseImages(body) {
  let images = [];
  if (Array.isArray(body.images) && body.images.length > 0) {
    images = body.images.map(s => s.trim()).filter(Boolean);
  } else if (typeof body.image === 'string' && body.image.trim()) {
    images = [body.image.trim()];
  }
  return images;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const database = await getDb();
    const col = database.collection('products');

    switch (req.method) {

      case 'GET': {
        const products = await col.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ products, count: products.length, source: 'database' });
      }

      case 'POST': {
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        const { name, price, description, categoryId, stock } = req.body;
        const images = normaliseImages(req.body);
        if (!name || !price || images.length === 0 || !categoryId) {
          return res.status(400).json({ error: 'Name, price, at least one image, and categoryId are required' });
        }
        if (typeof price !== 'number' || price <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        const product = {
          name, price,
          image: images[0],
          images,
          description: description || '',
          categoryId,
          stock: typeof stock === 'number' ? stock : (parseInt(stock, 10) || 0),
          createdAt: new Date(),
        };
        const result = await col.insertOne(product);
        return res.status(201).json({ message: 'Product created successfully', product: { _id: result.insertedId, ...product } });
      }

      case 'PUT': {
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });
        const { name, price, description, categoryId, stock } = req.body;
        const images = normaliseImages(req.body);
        if (!name || !price || images.length === 0 || !categoryId) {
          return res.status(400).json({ error: 'Name, price, at least one image, and categoryId are required' });
        }
        const updates = {
          name,
          price: typeof price === 'number' ? price : parseFloat(price),
          image: images[0],
          images,
          description: description || '',
          categoryId,
          stock: typeof stock === 'number' ? stock : (parseInt(stock, 10) || 0),
          updatedAt: new Date(),
        };
        const result = await col.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        ).catch(async () => col.updateOne({ _id: id }, { $set: updates }));
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({ message: 'Product updated successfully', product: { _id: id, ...updates } });
      }

      case 'DELETE': {
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing ID' });
        const result = await col.deleteOne({ _id: new ObjectId(id) })
          .catch(async () => col.deleteOne({ _id: id }));
        if (!result || result.deletedCount === 0) {
          return res.status(404).json({ success: false, deletedCount: 0, message: 'Product not found' });
        }
        return res.status(200).json({ success: true, deletedCount: 1 });
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('PRODUCTS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
