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

/** Silently attempt admin auth — used for GET to conditionally include internal fields. */
async function tryAdminAuth(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return false;
    return await isAdmin(decoded.email, db);
  } catch {
    return false;
  }
}

const JEANS_SIZES = ['28', '30', '32', '34', '36'];
const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALL_VALID_SIZES = new Set([...JEANS_SIZES, ...APPAREL_SIZES]);

function normaliseSizeStock(sizeStock) {
  if (!sizeStock || typeof sizeStock !== 'object') {
    return Object.fromEntries(JEANS_SIZES.map(s => [s, 0]));
  }
  const result = {};
  for (const key of Object.keys(sizeStock)) {
    if (ALL_VALID_SIZES.has(key)) {
      result[key] = Math.max(0, parseInt(sizeStock[key] ?? 0, 10) || 0);
    }
  }
  if (Object.keys(result).length === 0) {
    return Object.fromEntries(JEANS_SIZES.map(s => [s, 0]));
  }
  return result;
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

function normaliseHighlights(highlights) {
  if (!highlights || typeof highlights !== 'object') return null;
  return {
    color: highlights.color || '',
    length: highlights.length || '',
    printsPattern: highlights.printsPattern || '',
    waistRise: highlights.waistRise || '',
    shade: highlights.shade || '',
    lengthInches: highlights.lengthInches || '',
  };
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
        const isAdminRequest = await tryAdminAuth(req, database);

        const filter = {};

        // Price cap filter (deals pages)
        const rawMax = req.query?.maxPrice;
        if (rawMax !== undefined) {
          const maxPrice = Number(rawMax);
          if (Number.isFinite(maxPrice) && maxPrice > 0) {
            filter.price = { $lte: maxPrice };
          }
        }

        // Section filter — allows /api/products?section=denim to restrict to one section
        const rawSection = req.query?.section;
        if (rawSection && typeof rawSection === 'string' && rawSection.trim()) {
          filter.section = rawSection.trim();
        }

        // Fetch with all stored pricing fields; strip internal fields below
        const raw = await col.find(
          filter,
          {
            projection: {
              name: 1, price: 1, mrp: 1, purchasePrice: 1,
              image: 1, images: 1, description: 1, categoryId: 1,
              section: 1, stock: 1, sizeStock: 1, highlights: 1,
              createdAt: 1, brandId: 1,
            },
          }
        ).sort({ createdAt: -1 }).toArray();

        /**
         * Normalise pricing for response:
         * - mrp: customer-facing crossed-out price.
         *   For legacy products that stored MRP in purchasePrice (before this refactor),
         *   fall back to that value so the storefront still shows the crossed-out price.
         * - purchasePrice (internal cost): only returned for admin requests.
         *   Never exposed to public consumers.
         */
        const products = raw.map(({ purchasePrice: costPrice, mrp, ...rest }) => ({
          ...rest,
          mrp: mrp ?? costPrice ?? null,
          ...(isAdminRequest ? { purchasePrice: costPrice ?? null } : {}),
        }));

        return res.status(200).json({ products, count: products.length, source: 'database' });
      }

      case 'POST': {
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }

        const { name, price, mrp, purchasePrice, description, categoryId, sizeStock, highlights, brandId } = req.body;
        const section = req.body.section || 'denim';
        const images = normaliseImages(req.body);
        const needsCategory = section !== 'live-sale' && section !== 'kurta';

        if (!name || !price || images.length === 0 || (needsCategory && !categoryId)) {
          return res.status(400).json({
            error: 'Name, price, at least one image are required' + (needsCategory ? ', and categoryId' : ''),
          });
        }
        if (typeof price !== 'number' || price <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }

        const normalisedSizeStock = normaliseSizeStock(sizeStock);
        const totalStock = computeTotalStock(normalisedSizeStock);
        const normalisedHighlights = normaliseHighlights(highlights);

        const product = {
          name,
          price,
          // mrp = customer-facing crossed-out / original price
          ...(mrp && Number(mrp) > 0 ? { mrp: Number(mrp) } : {}),
          // purchasePrice = internal cost price (admin-only, never shown to customers)
          ...(purchasePrice && Number(purchasePrice) > 0 ? { purchasePrice: Number(purchasePrice) } : {}),
          ...(brandId ? { brandId: String(brandId) } : {}),
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
        return res.status(201).json({
          message: 'Product created successfully',
          product: { _id: result.insertedId, ...product },
        });
      }

      case 'PUT': {
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });

        const { name, price, mrp, purchasePrice, description, categoryId, sizeStock, highlights, brandId: putBrandId } = req.body;
        const putSection = req.body.section || 'denim';
        const images = normaliseImages(req.body);
        const putNeedsCategory = putSection !== 'live-sale' && putSection !== 'kurta';

        if (!name || !price || images.length === 0 || (putNeedsCategory && !categoryId)) {
          return res.status(400).json({
            error: 'Name, price, at least one image are required' + (putNeedsCategory ? ', and categoryId' : ''),
          });
        }

        const normalisedSizeStock = normaliseSizeStock(sizeStock);
        const totalStock = computeTotalStock(normalisedSizeStock);
        const normalisedHighlights = normaliseHighlights(highlights);

        const setFields = {
          name,
          price: typeof price === 'number' ? price : parseFloat(price),
          image: images[0],
          images,
          description: description || '',
          categoryId: categoryId || '',
          section: putSection,
          sizeStock: normalisedSizeStock,
          stock: totalStock,
          highlights: normalisedHighlights,
          updatedAt: new Date(),
        };

        const unsetFields = {};

        // mrp — set if provided, unset if cleared
        if (mrp && Number(mrp) > 0) {
          setFields.mrp = Number(mrp);
        } else {
          unsetFields.mrp = '';
        }

        // purchasePrice (cost) — set if provided, unset if cleared
        if (purchasePrice && Number(purchasePrice) > 0) {
          setFields.purchasePrice = Number(purchasePrice);
        } else {
          unsetFields.purchasePrice = '';
        }

        if (putBrandId) {
          setFields.brandId = String(putBrandId);
        } else {
          unsetFields.brandId = '';
        }

        const updateDoc = { $set: setFields };
        if (Object.keys(unsetFields).length > 0) updateDoc.$unset = unsetFields;

        const result = await col.updateOne(
          { _id: new ObjectId(id) },
          updateDoc,
        ).catch(async () => col.updateOne({ _id: id }, updateDoc));

        if (result.matchedCount === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({
          message: 'Product updated successfully',
          product: { _id: id, ...setFields },
        });
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
