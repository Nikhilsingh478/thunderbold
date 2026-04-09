import { getDb } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';

async function checkAdminAuth(req, database) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized' };
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyFirebaseToken(token);
  } catch {
    return { authorized: false, error: 'Unauthorized' };
  }
  if (!decoded?.email) return { authorized: false, error: 'Unauthorized' };
  const admin = await isAdmin(decoded.email, database);
  if (!admin) return { authorized: false, error: 'Admin access required' };
  return { authorized: true, userEmail: decoded.email };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const categoryId = req.query.id || req.params?.id;
    console.log('CATEGORIES [id] API: DELETE request for id:', categoryId);

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const database = await getDb();

    const authResult = await checkAdminAuth(req, database);
    if (!authResult.authorized) {
      console.log('CATEGORIES [id] API: Auth failed:', authResult.error);
      return res.status(authResult.error === 'Unauthorized' ? 401 : 403).json({ error: authResult.error });
    }

    const categoriesCollection = database.collection('categories');

    let result;
    try {
      result = await categoriesCollection.deleteOne({ _id: new ObjectId(categoryId) });
    } catch {
      result = await categoriesCollection.deleteOne({ _id: categoryId });
    }

    console.log('CATEGORIES [id] API: Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json({ success: true, message: 'Category deleted successfully' });

  } catch (error) {
    console.error('CATEGORIES [id] API ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
