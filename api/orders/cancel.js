import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';

function decodeFirebaseToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = decodeFirebaseToken(token);

    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userEmail = decoded.email;

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const database = await getDb();
    const ordersCollection = database.collection('orders');

    // Fetch the order first to verify it belongs to this user
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Allow the order owner OR admin to cancel
    const ADMIN_EMAIL = 'nikhilwebworks@gmail.com';
    if (order.userId !== userEmail && userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Delivered orders cannot be cancelled' });
    }

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Order could not be cancelled' });
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      orderId,
    });

  } catch (error) {
    console.error('ORDER CANCEL API ERROR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
