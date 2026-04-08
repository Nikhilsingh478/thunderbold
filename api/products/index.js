import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";
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
    console.log('PRODUCTS API: Starting request...');
    
    // Hard block for DELETE - should not hit index.js
    if (req.method === 'DELETE') {
      return res.status(405).json({
        error: 'DELETE must use /api/products/[id]'
      });
    }
    
    // Get database connection
    const database = await getDb();
    const productsCollection = database.collection('products');
    
    console.log('PRODUCTS API: Connected to database');

    switch (req.method) {
      case 'GET':
        console.log('PRODUCTS API: Fetching all products');
        
        // GET is public - no auth required
        const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
        console.log('PRODUCTS API: Found products in DB:', products.length);
        
        return res.status(200).json({ 
          products,
          count: products.length,
          source: 'database'
        });

      case 'POST':
        console.log('PRODUCTS API: Creating new product');
        
        // Check if user is admin
        const postAuthResult = checkAdminAuth(req);
        if (!postAuthResult.authorized) {
          console.log('PRODUCTS API: Auth failed for POST:', postAuthResult.error);
          return res.status(postAuthResult.error === 'Unauthorized' ? 401 : 403).json({ error: postAuthResult.error });
        }
        
        const { name: productName, price: productPrice, image: productImage, description: productDescription, categoryId: productCategoryId, stock: productStock } = req.body;
        console.log('PRODUCTS API: Product data:', { productName, productPrice, productImage, productDescription, productCategoryId, productStock });
        
        // Validate required fields
        if (!productName || !productPrice || !productImage || !productCategoryId) {
          return res.status(400).json({ error: 'Name, price, image, and categoryId are required' });
        }
        
        // Validate price
        if (typeof productPrice !== 'number' || productPrice <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        
        // Validate image URL
        if (typeof productImage !== 'string' || !productImage.trim()) {
          return res.status(400).json({ error: 'Image URL is required' });
        }

        // Create product object
        const product = {
          name: productName,
          price: productPrice,
          image: productImage,
          description: productDescription || '',
          categoryId: productCategoryId,
          stock: productStock || 0,
          createdAt: new Date()
        };

        // Save product to database
        const createResult = await productsCollection.insertOne(product);
        console.log('PRODUCTS API: Product created successfully:', createResult.insertedId);

        return res.status(201).json({ 
          message: 'Product created successfully', 
          product: {
            _id: createResult.insertedId,
            ...product
          }
        });

      default:
        console.log('PRODUCTS API: Method not allowed:', req.method);
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('PRODUCTS API ERROR:', error);
    console.error('PRODUCTS API ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
