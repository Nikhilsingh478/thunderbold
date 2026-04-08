const { getDb } = require('../_lib/mongodb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('CART API: Starting request...');
    
    // Get user ID from token (simplified approach)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('CART API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('CART API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const cartCollection = database.collection('cart');
    
    console.log('CART API: Connected to database');

    switch (req.method) {
      case 'GET':
        console.log('CART API: Getting cart for user:', userId);
        const cart = await cartCollection.findOne({ userId });
        console.log('CART API: Found cart:', cart ? 'Yes' : 'No');
        
        if (cart) {
          return res.status(200).json({ items: cart.items || [] });
        } else {
          return res.status(200).json({ items: [] });
        }

      case 'POST':
        console.log('CART API: Saving cart for user:', userId);
        const { items } = req.body;
        console.log('CART API: Items to save:', items);
        
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }

        // Validate items structure
        const validItems = items.every(item => 
          item.productId && 
          item.name && 
          typeof item.price === 'number' && 
          item.image && 
          item.size && 
          typeof item.quantity === 'number' && 
          item.quantity > 0
        );

        if (!validItems) {
          console.log('CART API: Invalid item structure');
          return res.status(400).json({ error: 'Invalid item structure' });
        }

        await cartCollection.updateOne(
          { userId },
          { 
            $set: { 
              items,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        console.log('CART API: Cart saved successfully');
        return res.status(200).json({ message: 'Cart saved successfully', items });

      case 'DELETE':
        console.log('CART API: Clearing cart for user:', userId);
        await cartCollection.deleteOne({ userId });
        return res.status(200).json({ message: 'Cart cleared successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CART API ERROR:', error);
    console.error('CART API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
