import { getDb } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('ORDERS API: Starting request...');
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('ORDERS API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('ORDERS API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const ordersCollection = database.collection('orders');
    
    console.log('ORDERS API: Connected to database');

    switch (req.method) {
      case 'POST':
        console.log('ORDERS API: Creating order for user:', userId);
        
        const { products, address, paymentMethod } = req.body;
        console.log('ORDERS API: Order data:', { products, address, paymentMethod });
        
        // Validate required fields
        if (!products || !Array.isArray(products) || products.length === 0) {
          return res.status(400).json({ error: 'Products are required' });
        }
        
        if (!address || !address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
          return res.status(400).json({ error: 'Complete address is required' });
        }
        
        if (!paymentMethod) {
          return res.status(400).json({ error: 'Payment method is required' });
        }
        
        // Validate products structure
        const validProducts = products.every(product => 
          product.productId && 
          product.name && 
          typeof product.price === 'number' && 
          product.image && 
          product.size && 
          typeof product.quantity === 'number' && 
          product.quantity > 0
        );

        if (!validProducts) {
          console.log('ORDERS API: Invalid product structure');
          return res.status(400).json({ error: 'Invalid product structure' });
        }

        // Create order object
        const order = {
          userId,
          products,
          address,
          paymentMethod,
          status: 'pending',
          createdAt: new Date(),
          totalAmount: products.reduce((total, product) => total + (product.price * product.quantity), 0)
        };

        // Save order to database
        const result = await ordersCollection.insertOne(order);
        console.log('ORDERS API: Order created successfully:', result.insertedId);

        return res.status(201).json({ 
          message: 'Order created successfully', 
          orderId: result.insertedId,
          order 
        });

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('ORDERS API ERROR:', error);
    console.error('ORDERS API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
