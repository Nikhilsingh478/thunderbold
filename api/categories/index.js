import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from 'mongodb';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';

// Helper function to check admin authentication (Firebase-based, same as other routes)
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('CATEGORIES API: Starting request...');
    
    // Get database connection
    const database = await getDb();
    const categoriesCollection = database.collection('categories');
    
    console.log('CATEGORIES API: Connected to database');

    // Extract category ID — prefer query param (e.g. ?id=xxx), fall back to URL path segment
    const categoryId = req.query?.id || (() => {
      const urlParts = req.url.split('?')[0].split('/');
      return urlParts[urlParts.length - 1];
    })();

    switch (req.method) {
      case 'GET':
        console.log('CATEGORIES API: Fetching all categories');
        
        // GET is public - no auth required
        const categories = await categoriesCollection.find({}).sort({ createdAt: -1 }).toArray();
        console.log('CATEGORIES API: Found categories in DB:', categories.length);
        
        return res.status(200).json({ 
          categories,
          count: categories.length,
          source: 'database'
        });

      case 'POST':
        console.log('CATEGORIES API: Creating new category');
        
        // Check if user is admin
        const postAuthResult = await checkAdminAuth(req, database);
        if (!postAuthResult.authorized) {
          console.log('CATEGORIES API: Auth failed for POST:', postAuthResult.error);
          return res.status(postAuthResult.error === 'Unauthorized' ? 401 : 403).json({ error: postAuthResult.error });
        }
        
        const { name: categoryName, image: categoryImage } = req.body;
        console.log('CATEGORIES API: Category data:', { categoryName, categoryImage });
        
        // Validate required fields
        if (!categoryName || !categoryImage) {
          return res.status(400).json({ error: 'Name and image are required' });
        }
        
        // Validate image URL
        if (typeof categoryImage !== 'string' || !categoryImage.trim()) {
          return res.status(400).json({ error: 'Image URL is required' });
        }

        // Create category object
        const category = {
          name: categoryName,
          image: categoryImage,
          createdAt: new Date()
        };

        // Save category to database
        const createResult = await categoriesCollection.insertOne(category);
        console.log('CATEGORIES API: Category created successfully:', createResult.insertedId);

        return res.status(201).json({ 
          message: 'Category created successfully', 
          category: {
            _id: createResult.insertedId,
            ...category
          }
        });

      case 'DELETE':
        console.log('CATEGORIES API: DELETE request received, categoryId:', categoryId, 'query:', req.query);

        if (!categoryId || categoryId === '' || categoryId === '/') {
          return res.status(400).json({ error: 'Category ID is required' });
        }
        
        // Check if user is admin
        const deleteAuthResult = await checkAdminAuth(req, database);
        if (!deleteAuthResult.authorized) {
          console.log('CATEGORIES API: Auth failed for DELETE:', deleteAuthResult.error);
          return res.status(deleteAuthResult.error === 'Unauthorized' ? 401 : 403).json({ error: deleteAuthResult.error });
        }
        
        // Delete category — try ObjectId first, fall back to string match
        let deleteCategoryResult;
        try {
          deleteCategoryResult = await categoriesCollection.deleteOne({ _id: new ObjectId(categoryId) });
        } catch {
          deleteCategoryResult = await categoriesCollection.deleteOne({ _id: categoryId });
        }

        if (deleteCategoryResult.deletedCount === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        
        console.log('CATEGORIES API: Category deleted successfully');
        return res.status(200).json({ 
          success: true,
          message: 'Category deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CATEGORIES API ERROR:', error);
    console.error('CATEGORIES API ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url
    });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
