import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

function decodeFirebaseToken(token) {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    console.log('ORDER STATUS UPDATE API: Method:', req.method);
    console.log('ORDER STATUS UPDATE API: Order ID:', req.query.id);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = decodeFirebaseToken(token);
    if (!decodedToken || !decodedToken.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = decodedToken.email;
    console.log('ORDER STATUS UPDATE API: User email:', userId);

    if (userId !== ADMIN_EMAIL) {
      console.log('ORDER STATUS UPDATE API: Access denied for:', userId);
      return res.status(403).json({ error: 'Admin access required' });
    }

    const database = await getDb();
    const ordersCollection = database.collection('orders');

    if (req.method === 'PATCH') {
      const body = await parseBody(req);
      const { status } = body;
      console.log('ORDER STATUS UPDATE API: Updating status to:', status);

      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Valid values: pending, confirmed, shipped, delivered' });
      }

      const orderId = req.query.id;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      let objectId;
      try {
        objectId = new ObjectId(orderId);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid order ID format' });
      }

      const result = await ordersCollection.updateOne(
        { _id: objectId },
        { $set: { status, updatedAt: new Date() } }
      );

      console.log('ORDER STATUS UPDATE API: matchedCount:', result.matchedCount);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({
        message: 'Order status updated successfully',
        orderId,
        newStatus: status
      });

    } else {
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('ORDER STATUS UPDATE API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
