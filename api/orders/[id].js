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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('ORDER STATUS UPDATE API: Starting request...');
    console.log('ORDER STATUS UPDATE API: Method:', req.method);
    console.log('ORDER STATUS UPDATE API: Order ID:', req.query.id);
    console.log('ORDER STATUS UPDATE API: Request body:', req.body);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('ORDER STATUS UPDATE API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = decodeFirebaseToken(token);
    if (!decodedToken || !decodedToken.email) {
      console.log('ORDER STATUS UPDATE API: Invalid token or missing email');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = decodedToken.email;
    console.log('ORDER STATUS UPDATE API: User email:', userId);

    const database = await getDb();
    const ordersCollection = database.collection('orders');

    console.log('ORDER STATUS UPDATE API: Connected to database');

    if (req.method === 'PATCH') {
      const { status } = req.body;
      console.log('ORDER STATUS UPDATE API: Updating status to:', status);

      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Valid statuses: pending, confirmed, shipped, delivered' });
      }

      if (userId !== ADMIN_EMAIL) {
        console.log('ORDER STATUS UPDATE API: Access denied for:', userId);
        return res.status(403).json({ error: 'Admin access required' });
      }

      const orderId = req.query.id;

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

      console.log('ORDER STATUS UPDATE API: Update result:', result);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log('ORDER STATUS UPDATE API: Status updated successfully');
      return res.status(200).json({
        message: 'Order status updated successfully',
        orderId,
        newStatus: status
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('ORDER STATUS UPDATE API ERROR:', error);
    console.error('ORDER STATUS UPDATE API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
