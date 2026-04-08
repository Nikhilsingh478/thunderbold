import { getDb } from "../_lib/mongodb.js";

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

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
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('PRODUCTS API: No auth header found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token; // TEMP: Use token as userId for now
    
    console.log('PRODUCTS API: User ID:', userId);
    
    // Get database connection
    const database = await getDb();
    const productsCollection = database.collection('products');
    
    console.log('PRODUCTS API: Connected to database');

    // Extract product ID from URL for PUT/DELETE operations
    const urlParts = req.url.split('/');
    const productId = urlParts[urlParts.length - 1];

    switch (req.method) {
      case 'GET':
        console.log('PRODUCTS API: Fetching all products');
        
        // Fetch from MongoDB only
        const products = await productsCollection.find({}).toArray();
        console.log('PRODUCTS API: Found products in DB:', products.length);
        
        return res.status(200).json({ 
          products,
          count: products.length,
          source: 'database'
        });

      case 'POST':
        console.log('PRODUCTS API: Creating new product');
        
        // Check if user is admin
        if (userId !== ADMIN_EMAIL) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { name: productName, price: productPrice, image: productImage, description: productDescription, category: productCategory, stock: productStock } = req.body;
        console.log('PRODUCTS API: Product data:', { productName, productPrice, productImage, productDescription, productCategory, productStock });
        
        // Validate required fields
        if (!productName || !productPrice || !productImage || !productCategory) {
          return res.status(400).json({ error: 'Name, price, image, and category are required' });
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
          category: productCategory,
          stock: productStock || 0,
          createdAt: new Date()
        };

        // Save product to database
        const createResult = await productsCollection.insertOne(product);
        console.log('PRODUCTS API: Product created successfully:', createResult.insertedId);

        return res.status(201).json({ 
          message: 'Product created successfully', 
          productId: createResult.insertedId,
          product 
        });

      case 'PUT':
        console.log('PRODUCTS API: Updating product:', productId);
        
        // Check if user is admin
        if (userId !== ADMIN_EMAIL) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { name: updateName, price: updatePrice, image: updateImage, description: updateDescription, category: updateCategory, stock: updateStock } = req.body;
        console.log('PRODUCTS API: Update data:', { updateName, updatePrice, updateImage, updateDescription, updateCategory, updateStock });
        
        // Validate required fields
        if (!updateName || !updatePrice || !updateImage || !updateCategory) {
          return res.status(400).json({ error: 'Name, price, image, and category are required' });
        }
        
        // Validate price
        if (typeof updatePrice !== 'number' || updatePrice <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        
        // Validate image URL
        if (typeof updateImage !== 'string' || !updateImage.trim()) {
          return res.status(400).json({ error: 'Image URL is required' });
        }

        // Update product
        const updateResult = await productsCollection.updateOne(
          { _id: productId },
          { 
            $set: {
              name: updateName,
              price: updatePrice,
              image: updateImage,
              description: updateDescription || '',
              category: updateCategory,
              stock: updateStock || 0,
              updatedAt: new Date()
            }
          }
        );

        console.log('PRODUCTS API: Product updated successfully');
        return res.status(200).json({ 
          message: 'Product updated successfully', 
          product 
        });

      case 'DELETE':
        console.log('PRODUCTS API: Deleting product:', productId);
        
        // Check if user is admin
        if (userId !== ADMIN_EMAIL) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        // Delete product
        const deleteResult = await productsCollection.deleteOne({ _id: productId });
        
        console.log('PRODUCTS API: Product deleted successfully');
        return res.status(200).json({ 
          message: 'Product deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
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
