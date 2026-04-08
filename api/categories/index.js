import { getDb } from "../_lib/mongodb.js";
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

// Helper function to check admin authentication
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.decode(token);
  } catch (decodeError) {
    return { authorized: false, error: 'Invalid token' };
  }
  
  const userEmail = decodedToken?.email;
  if (userEmail !== ADMIN_EMAIL) {
    return { authorized: false, error: 'Admin access required' };
  }
  
  return { authorized: true, userEmail };
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

    // Extract category ID from URL for PUT/DELETE operations
    const urlParts = req.url.split('/');
    const categoryId = urlParts[urlParts.length - 1];

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
        const postAuthResult = checkAdminAuth(req);
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
        console.log('CATEGORIES API: Deleting category:', categoryId);
        
        // Check if user is admin
        const deleteAuthResult = checkAdminAuth(req);
        if (!deleteAuthResult.authorized) {
          console.log('CATEGORIES API: Auth failed for DELETE:', deleteAuthResult.error);
          return res.status(deleteAuthResult.error === 'Unauthorized' ? 401 : 403).json({ error: deleteAuthResult.error });
        }
        
        // Delete category
        const deleteResult = await categoriesCollection.deleteOne({ _id: categoryId });
        
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
