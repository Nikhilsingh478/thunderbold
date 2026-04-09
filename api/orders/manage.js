import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

function decodeFirebaseToken(token) {
  try {
    return jwt.decode(token);
  } catch {
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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = decodeFirebaseToken(token);
    if (!decoded?.email) return res.status(401).json({ error: 'Unauthorized' });
    if (decoded.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Admin access required' });

    const orderId = req.query.id;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    let objectId;
    try { objectId = new ObjectId(orderId); }
    catch { return res.status(400).json({ error: 'Invalid order ID format' }); }

    const db = await getDb();
    const orders = db.collection('orders');

    if (req.method === 'PATCH') {
      const body = await parseBody(req);
      const { status } = body;
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Valid: pending, confirmed, shipped, delivered' });
      }
      console.log('MANAGE ORDERS API: PATCH status →', status, 'for', orderId);
      const result = await orders.updateOne(
        { _id: objectId },
        { $set: { status, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Order not found' });
      console.log('MANAGE ORDERS API: Status updated');
      return res.status(200).json({ message: 'Status updated', orderId, newStatus: status });
    }

    if (req.method === 'DELETE') {
      console.log('MANAGE ORDERS API: DELETE order', orderId);
      const result = await orders.deleteOne({ _id: objectId });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Order not found' });
      console.log('MANAGE ORDERS API: Deleted');
      return res.status(200).json({ message: 'Order deleted', orderId });
    }
  } catch (error) {
    console.error('MANAGE ORDERS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
