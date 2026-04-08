import { getDb } from "../_lib/mongodb.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('GET ORDERS API: Starting request...');
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('GET ORDERS API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('GET ORDERS API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const ordersCollection = database.collection('orders');
    
    console.log('GET ORDERS API: Connected to database');

    switch (req.method) {
      case 'GET':
        console.log('GET ORDERS API: Fetching orders for user:', userId);
        
        // Fetch orders for user, sorted by latest first
        const orders = await ordersCollection
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();
        
        console.log('GET ORDERS API: Found orders:', orders.length);
        
        return res.status(200).json({ 
          orders,
          count: orders.length 
        });

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('GET ORDERS API ERROR:', error);
    console.error('GET ORDERS API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
