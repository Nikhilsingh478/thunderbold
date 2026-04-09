import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from 'mongodb';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';

async function checkAdminAuth(req, database) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { authorized: false, error: 'Unauthorized' };
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    if (!decoded?.email) return { authorized: false, error: 'Unauthorized' };
    const admin = await isAdmin(decoded.email, database);
    if (!admin) return { authorized: false, error: 'Admin access required' };
    return { authorized: true, userEmail: decoded.email };
  } catch {
    return { authorized: false, error: 'Unauthorized' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const database = await getDb();
    const categoriesCollection = database.collection('categories');

    // ID from query param (?id=xxx) — set by frontend for DELETE
    const categoryId = req.query?.id || (() => {
      const parts = req.url.split('?')[0].split('/');
      return parts[parts.length - 1];
    })();

    switch (req.method) {
      case 'GET': {
        const categories = await categoriesCollection.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ categories, count: categories.length, source: 'database' });
      }

      case 'POST': {
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        const { name: categoryName, image: categoryImage } = req.body;
        if (!categoryName || !categoryImage || typeof categoryImage !== 'string' || !categoryImage.trim()) {
          return res.status(400).json({ error: 'Name and image are required' });
        }
        const category = { name: categoryName, image: categoryImage, createdAt: new Date() };
        const createResult = await categoriesCollection.insertOne(category);
        return res.status(201).json({
          message: 'Category created successfully',
          category: { _id: createResult.insertedId, ...category }
        });
      }

      case 'DELETE': {
        if (!categoryId || categoryId === '' || categoryId === '/') {
          return res.status(400).json({ error: 'Category ID is required' });
        }
        const auth = await checkAdminAuth(req, database);
        if (!auth.authorized) {
          return res.status(auth.error === 'Unauthorized' ? 401 : 403).json({ error: auth.error });
        }
        let result;
        try {
          result = await categoriesCollection.deleteOne({ _id: new ObjectId(categoryId) });
        } catch {
          result = await categoriesCollection.deleteOne({ _id: categoryId });
        }
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Category not found' });
        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CATEGORIES API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
