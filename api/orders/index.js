import { getDb } from "../_lib/mongodb.js";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";
import { isAdmin } from "../_lib/adminHelper.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
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
    const ordersCollection = database.collection('orders');

    const adminUser = await isAdmin(userId, database);
    const query = adminUser ? {} : { userId };
    const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({ orders, count: orders.length });

  } catch (error) {
    console.error('GET ORDERS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
