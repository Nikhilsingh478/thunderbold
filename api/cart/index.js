const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);

async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  // In a real app, you'd verify the Firebase token
  // For now, we'll use a simple approach (you should implement proper token verification)
  try {
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return decoded;
  } catch (error) {
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
    await client.connect();
    const database = client.db('thunderbolt');
    const cartCollection = database.collection('cart');

    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.uid || user.sub;

    switch (req.method) {
      case 'GET':
        // Get user's cart
        const cart = await cartCollection.findOne({ userId });
        if (cart) {
          return res.status(200).json({ items: cart.items || [] });
        } else {
          return res.status(200).json({ items: [] });
        }

      case 'POST':
        // Save/update user's cart
        const { items } = req.body;
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

        return res.status(200).json({ message: 'Cart saved successfully', items });

      case 'DELETE':
        // Clear user's cart
        await cartCollection.deleteOne({ userId });
        return res.status(200).json({ message: 'Cart cleared successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Cart API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
};
