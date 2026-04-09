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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
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

    console.log('DELETE ORDER API: orderId:', orderId);
    const db = await getDb();
    const result = await db.collection('orders').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Order not found' });

    console.log('DELETE ORDER API: Deleted successfully');
    return res.status(200).json({ message: 'Order deleted', orderId });
  } catch (error) {
    console.error('DELETE ORDER API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
