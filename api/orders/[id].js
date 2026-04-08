import { getDb } from "../../_lib/mongodb.js";

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

export default async function handler(req, res) {
  // Set CORS headers
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
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('ORDER STATUS UPDATE API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('ORDER STATUS UPDATE API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const ordersCollection = database.collection('orders');
    
    console.log('ORDER STATUS UPDATE API: Connected to database');

    if (req.method === 'PATCH') {
      const { status } = req.body;
      console.log('ORDER STATUS UPDATE API: Updating status to:', status);
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Valid statuses: pending, confirmed, shipped, delivered' });
      }
      
      // Check if user is admin
      if (userId !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Update order status
      const result = await ordersCollection.updateOne(
        { _id: req.query.id },
        { $set: { status, updatedAt: new Date() } }
      );
      
      console.log('ORDER STATUS UPDATE API: Update result:', result);
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      console.log('ORDER STATUS UPDATE API: Status updated successfully');
      return res.status(200).json({ 
        message: 'Order status updated successfully',
        orderId: req.query.id,
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
