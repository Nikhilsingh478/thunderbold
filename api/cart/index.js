import { getDb } from "../_lib/mongodb.js";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isRateLimited } from "../_lib/rateLimit.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = await verifyFirebaseToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!decoded?.email) return res.status(401).json({ error: 'Unauthorized' });

    const userId = decoded.email;
    const database = await getDb();
    const cartCollection = database.collection('cart');

    switch (req.method) {
      case 'GET': {
        const cart = await cartCollection.findOne({ userId });
        return res.status(200).json({ items: cart?.items || [] });
      }

      case 'POST': {
        const { items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({ error: 'Items must be an array' });
        const validItems = items.every(item =>
          item.productId && item.name &&
          typeof item.price === 'number' &&
          item.image && item.size &&
          typeof item.quantity === 'number' && item.quantity > 0
        );
        if (!validItems) return res.status(400).json({ error: 'Invalid item structure' });
        await cartCollection.updateOne(
          { userId },
          { $set: { items, updatedAt: new Date() } },
          { upsert: true }
        );
        return res.status(200).json({ message: 'Cart saved successfully', items });
      }

      case 'DELETE': {
        await cartCollection.deleteOne({ userId });
        return res.status(200).json({ message: 'Cart cleared successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CART API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
