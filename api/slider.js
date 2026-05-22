import { getDb } from './_lib/mongodb.js';
import { verifyFirebaseToken } from './_lib/firebaseAdmin.js';
import { isAdmin } from './_lib/adminHelper.js';

/**
 * Slider config API — uses the existing `config` MongoDB collection.
 * Document: { _id: 'slider', slides: SlideConfig[4] }
 *
 * GET  /api/slider            — public, returns 4-slide config + mapped product info
 * PUT  /api/slider            — admin auth, replaces slide config
 */

/** Default 4 slides used on first request when no config exists yet. */
const DEFAULT_SLIDES = [
  { imageUrl: '', heading: 'SHARP',  productId: null },
  { imageUrl: '', heading: 'REBEL',  productId: null },
  { imageUrl: '', heading: 'WILD',   productId: null },
  { imageUrl: '', heading: 'NOIR',   productId: null },
];

async function checkAdminAuth(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { authorized: false };
  try {
    const decoded = await verifyFirebaseToken(authHeader.split(' ')[1]);
    if (!decoded?.email) return { authorized: false };
    const admin = await isAdmin(decoded.email, db);
    return { authorized: admin };
  } catch {
    return { authorized: false };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const configCol = db.collection('config');

    if (req.method === 'GET') {
      const doc = await configCol.findOne({ _id: 'slider' });
      const rawSlides = doc?.slides ?? DEFAULT_SLIDES;

      // Enrich with product name + image for frontend display (single query)
      const { ObjectId } = await import('mongodb');
      const productIds = rawSlides
        .map(s => s.productId)
        .filter(Boolean)
        .map(id => { try { return new ObjectId(String(id)); } catch { return null; } })
        .filter(Boolean);

      let productMap = new Map();
      if (productIds.length) {
        const products = await db.collection('products')
          .find({ _id: { $in: productIds } }, { projection: { name: 1, image: 1, images: 1 } })
          .toArray();
        products.forEach(p => productMap.set(String(p._id), p));
      }

      const slides = rawSlides.map(s => {
        const p = s.productId ? productMap.get(String(s.productId)) : null;
        return {
          imageUrl: s.imageUrl || '',
          heading: s.heading || '',
          productId: s.productId || null,
          productName: p?.name || null,
          productImage: p ? (p.images?.[0] || p.image || null) : null,
        };
      });

      return res.status(200).json({ slides });
    }

    if (req.method === 'PUT') {
      const auth = await checkAdminAuth(req, db);
      if (!auth.authorized) return res.status(403).json({ error: 'Admin access required' });

      const { slides } = req.body || {};
      if (!Array.isArray(slides) || slides.length !== 4) {
        return res.status(400).json({ error: 'slides must be an array of exactly 4 items' });
      }

      // Sanitise — only keep allowed fields, coerce types
      const cleaned = slides.map(s => ({
        imageUrl: typeof s.imageUrl === 'string' ? s.imageUrl.trim() : '',
        heading: typeof s.heading === 'string' ? s.heading.trim().toUpperCase().slice(0, 40) : '',
        productId: s.productId ? String(s.productId) : null,
      }));

      await configCol.replaceOne(
        { _id: 'slider' },
        { _id: 'slider', slides: cleaned, updatedAt: new Date() },
        { upsert: true },
      );

      return res.status(200).json({ message: 'Slider config saved', slides: cleaned });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SLIDER API ERROR:', err.message);
    return res.status(500).json({ error: 'Database unavailable' });
  }
}
