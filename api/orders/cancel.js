import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper function to check if user is admin
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  // Check if user is admin
  if (decoded.email !== 'nikhilwebworks@gmail.com') {
    return { authorized: false, error: 'Forbidden' };
  }
  
  return { authorized: true, user: decoded };
}

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('ORDER CANCEL API: Starting cancellation');
    
    // Check if user is admin
    const authResult = checkAdminAuth(req);
    if (!authResult.authorized) {
      console.log('ORDER CANCEL API: Auth failed:', authResult.error);
      return res.status(authResult.error === 'Unauthorized' ? 401 : 403).json({ error: authResult.error });
    }

    const { orderId } = req.body;
    
    if (!orderId) {
      console.log('ORDER CANCEL API: No order ID provided');
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log('ORDER CANCEL API: Cancelling order:', orderId);

    const database = await getDb();
    const ordersCollection = database.collection('orders');

    // Update order status to cancelled
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );

    console.log('ORDER CANCEL API: Update result:', result);

    if (result.matchedCount === 0) {
      console.log('ORDER CANCEL API: Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (result.modifiedCount === 0) {
      console.log('ORDER CANCEL API: Order already cancelled or status unchanged');
      return res.status(400).json({ error: 'Order status unchanged' });
    }

    console.log('ORDER CANCEL API: Order cancelled successfully:', orderId);
    return res.status(200).json({ 
      success: true,
      message: 'Order cancelled successfully',
      orderId: orderId
    });

  } catch (error) {
    console.error('ORDER CANCEL API ERROR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
