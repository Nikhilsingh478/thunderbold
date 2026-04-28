import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isAdmin } from "../_lib/adminHelper.js";

async function checkAdminAuth(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { authorized: false, error: 'Unauthorized' };
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return { authorized: false, error: 'Unauthorized' };
    const admin = await isAdmin(decoded.email, db);
    if (!admin) return { authorized: false, error: 'Admin access required' };
    return { authorized: true, userEmail: decoded.email };
  } catch {
    return { authorized: false, error: 'Unauthorized' };
  }
}

const VALID_SIZES = ['28', '30', '32', '34', '36'];

function normaliseSizeStock(sizeStock) {
  if (!sizeStock || typeof sizeStock !== 'object') {
    return Object.fromEntries(VALID_SIZES.map(s => [s, 0]));
  }
  return Object.fromEntries(
    VALID_SIZES.map(s => [s, Math.max(0, parseInt(sizeStock[s] ?? 0, 10) || 0)])
  );
}

function computeTotalStock(sizeStock) {
  return Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0);
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
        // Optional price-cap filter for /deals/* pages.
        // Validates strictly so unrelated traffic isn't affected.
        const filter = {};
        const rawMax = req.query?.maxPrice;
        if (rawMax !== undefined) {
          const maxPrice = Number(rawMax);
          if (Number.isFinite(maxPrice) && maxPrice > 0) {
            filter.price = { $lte: maxPrice };
          }
        }

        const products = await col.find(
          filter,
          { projection: { name: 1, price: 1, image: 1, images: 1, description: 1, categoryId: 1, section: 1, stock: 1, sizeStock: 1, highlights: 1, createdAt: 1 } }
        ).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ products, count: products.length, source: 'database' });
      }

      case 'POST': {
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        const { name, price, description, categoryId, sizeStock, highlights } = req.body;
        const section = req.body.section || 'denim';
        const images = normaliseImages(req.body);
        const needsCategory = section !== 'live-sale';
        if (!name || !price || images.length === 0 || (needsCategory && !categoryId)) {
          return res.status(400).json({ error: 'Name, price, at least one image are required' + (needsCategory ? ', and categoryId' : '') });
        }
        if (typeof price !== 'number' || price <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        const normalisedSizeStock = normaliseSizeStock(sizeStock);
        const totalStock = computeTotalStock(normalisedSizeStock);
        const normalisedHighlights = highlights && typeof highlights === 'object' ? {
          color: highlights.color || '',
          length: highlights.length || '',
          printsPattern: highlights.printsPattern || '',
          waistRise: highlights.waistRise || '',
          shade: highlights.shade || '',
          lengthInches: highlights.lengthInches || '',
        } : null;
        const product = {
          name, price,
          image: images[0],
          images,
          description: description || '',
          categoryId: categoryId || '',
          section,
          sizeStock: normalisedSizeStock,
          stock: totalStock,
          highlights: normalisedHighlights,
          createdAt: new Date(),
        };
        const result = await col.insertOne(product);
        return res.status(201).json({ message: 'Product created successfully', product: { _id: result.insertedId, ...product } });
      }

      case 'PUT': {
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });
        const { name, price, description, categoryId, sizeStock, highlights } = req.body;
        const putSection = req.body.section || 'denim';
        const images = normaliseImages(req.body);
        const putNeedsCategory = putSection !== 'live-sale';
        if (!name || !price || images.length === 0 || (putNeedsCategory && !categoryId)) {
          return res.status(400).json({ error: 'Name, price, at least one image are required' + (putNeedsCategory ? ', and categoryId' : '') });
        }
        const normalisedSizeStock = normaliseSizeStock(sizeStock);
        const totalStock = computeTotalStock(normalisedSizeStock);
        const normalisedHighlightsPut = highlights && typeof highlights === 'object' ? {
          color: highlights.color || '',
          length: highlights.length || '',
          printsPattern: highlights.printsPattern || '',
          waistRise: highlights.waistRise || '',
          shade: highlights.shade || '',
          lengthInches: highlights.lengthInches || '',
        } : null;
        const updates = {
          name,
          price: typeof price === 'number' ? price : parseFloat(price),
          image: images[0],
          images,
          description: description || '',
          categoryId: categoryId || '',
          section: putSection,
          sizeStock: normalisedSizeStock,
          stock: totalStock,
          highlights: normalisedHighlightsPut,
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
        const auth = await checkAdminAuth(req, database);
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
