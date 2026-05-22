import { getDb } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';
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
  const ADMIN_EMAILS = ['adminthunderbolt@gmail.com', 'neelsingh45940s@gmail.com', 'thepavanartt@gmail.com'];
  if (!ADMIN_EMAILS.includes(decoded.email)) {
    return { authorized: false, error: 'Forbidden' };
  }
  
  return { authorized: true, user: decoded };
}

export default async function handler(req, res) {
  console.log('DELETE ROUTE HIT SUCCESSFULLY');
  console.log('METHOD:', req.method);
  console.log('QUERY:', req.query);

  if (req.method !== 'DELETE') {
    console.log('WRONG METHOD:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    console.log('DELETE REQUEST ID:', id);

    // Check if user is admin
    const authResult = checkAdminAuth(req);
    if (!authResult.authorized) {
      console.log('DELETE AUTH FAILED:', authResult.error);
      return res.status(authResult.error === 'Unauthorized' ? 401 : 403).json({ error: authResult.error });
    }

    // Get database connection
    const database = await getDb();
    const collection = database.collection('products');

    // Log database state before deletion
    const all = await collection.find({}).toArray();
    console.log('ALL PRODUCTS IN DB:', all.map(p => ({ _id: p._id, name: p.name })));

    let result = null;

    // Handle ObjectId conversion correctly
    try {
      result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('ObjectId delete result:', result);
    } catch (e) {
      console.log('ObjectId failed, trying string match:', e.message);
      result = await collection.deleteOne({ _id: id });
      console.log('String ID delete result:', result);
    }

    console.log('DELETE RESULT:', result);

    // Return strict response format
    if (result.deletedCount === 0) {
      console.log('DELETE FAILED - product not found');
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        deletedCount: 0
      });
    }

    console.log('DELETE SUCCESS - product removed from DB');
    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('DELETE ERROR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
