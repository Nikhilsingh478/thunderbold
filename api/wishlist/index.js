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
    console.log('WISHLIST API: Starting request...');
    
    // Get user ID from token (simplified approach)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('WISHLIST API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('WISHLIST API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const wishlistCollection = database.collection('wishlist');
    
    console.log('WISHLIST API: Connected to database');

    switch (req.method) {
      case 'GET':
        console.log('WISHLIST API: Getting wishlist for user:', userId);
        const wishlist = await wishlistCollection.findOne({ userId });
        console.log('WISHLIST API: Found wishlist:', wishlist ? 'Yes' : 'No');
        
        if (wishlist) {
          return res.status(200).json({ items: wishlist.items || [] });
        } else {
          return res.status(200).json({ items: [] });
        }

      case 'POST':
        console.log('WISHLIST API: Saving wishlist for user:', userId);
        const { items } = req.body;
        console.log('WISHLIST API: Items to save:', items);
        
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }

        // Validate items structure
        const validItems = items.every(item => 
          item.productId && 
          item.name && 
          typeof item.price === 'number' && 
          item.image
        );

        if (!validItems) {
          console.log('WISHLIST API: Invalid item structure');
          return res.status(400).json({ error: 'Invalid item structure' });
        }

        await wishlistCollection.updateOne(
          { userId },
          { 
            $set: { 
              items,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        console.log('WISHLIST API: Wishlist saved successfully');
        return res.status(200).json({ message: 'Wishlist saved successfully', items });

      case 'DELETE':
        console.log('WISHLIST API: Clearing wishlist for user:', userId);
        await wishlistCollection.deleteOne({ userId });
        return res.status(200).json({ message: 'Wishlist cleared successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('WISHLIST API ERROR:', error);
    console.error('WISHLIST API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
