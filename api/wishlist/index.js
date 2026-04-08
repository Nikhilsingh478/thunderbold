const { getDb } = require('../_lib/mongodb');

async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Firebase tokens are JWTs with 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token format - not a proper JWT');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = Buffer.from(parts[1], 'base64').toString();
    const decoded = JSON.parse(payload);
    
    // Check if this looks like a Firebase token
    if (!decoded.uid && !decoded.sub) {
      console.log('Token missing uid/sub field');
      return null;
    }
    
    console.log('Successfully decoded user:', decoded.uid || decoded.sub);
    return decoded;
  } catch (error) {
    console.error('Token parsing error:', error.message);
    return null;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const database = await getDb();
    const wishlistCollection = database.collection('wishlist');

    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.uid || user.sub;

    switch (req.method) {
      case 'GET':
        // Get user's wishlist
        const wishlist = await wishlistCollection.findOne({ userId });
        if (wishlist) {
          return res.status(200).json({ items: wishlist.items || [] });
        } else {
          return res.status(200).json({ items: [] });
        }

      case 'POST':
        // Save/update user's wishlist
        const { items } = req.body;
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

        return res.status(200).json({ message: 'Wishlist saved successfully', items });

      case 'DELETE':
        // Clear user's wishlist
        await wishlistCollection.deleteOne({ userId });
        return res.status(200).json({ message: 'Wishlist cleared successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Wishlist API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
