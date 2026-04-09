import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken } from "../_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

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

    const userEmail = decoded.email;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    const database = await getDb();
    const ordersCollection = database.collection('orders');
    const productsCollection = database.collection('products');

    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nikhilwebworks@gmail.com';
    if (order.userId !== userEmail && userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }
    if (order.status === 'cancelled') return res.status(400).json({ error: 'Order is already cancelled' });
    if (order.status === 'delivered') return res.status(400).json({ error: 'Delivered orders cannot be cancelled' });

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );
    if (result.modifiedCount === 0) return res.status(400).json({ error: 'Order could not be cancelled' });

    // Restore stock for each item
    const orderProducts = order.products || [];
    for (const item of orderProducts) {
      if (!item.productId || !item.quantity) continue;
      try {
        await productsCollection.updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { stock: item.quantity } }
        );
      } catch {
        try {
          await productsCollection.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } }
          );
        } catch (err) {
          console.error('ORDER CANCEL: Failed to restore stock for:', item.productId, err.message);
        }
      }
    }

    console.log('ORDER CANCEL: Stock restored for order:', orderId);
    return res.status(200).json({ success: true, message: 'Order cancelled successfully', orderId });

  } catch (error) {
    console.error('ORDER CANCEL API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
