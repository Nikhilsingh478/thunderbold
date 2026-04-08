import { getDb } from "../_lib/mongodb.js";
import { ObjectId } from "mongodb";

// Cleanup script for legacy products
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== LEGACY PRODUCTS CLEANUP START ===');
    
    const database = await getDb();
    const productsCollection = database.collection('products');
    
    // Find all legacy products (missing categoryId)
    const legacyProducts = await productsCollection.find({ 
      categoryId: { $exists: false } 
    }).toArray();
    
    console.log('Found legacy products:', legacyProducts.length);
    
    if (legacyProducts.length === 0) {
      return res.status(200).json({ 
        message: 'No legacy products found',
        cleaned: 0
      });
    }
    
    // Option 1: Delete all legacy products (FAST)
    const deleteResult = await productsCollection.deleteMany({ 
      categoryId: { $exists: false } 
    });
    
    console.log('Deleted legacy products:', deleteResult.deletedCount);
    
    // Option 2: Backfill with null categoryId (SAFE)
    // const updateResult = await productsCollection.updateMany(
    //   { categoryId: { $exists: false } },
    //   { $set: { categoryId: null } }
    // );
    
    return res.status(200).json({ 
      message: 'Legacy products cleaned up successfully',
      cleaned: deleteResult.deletedCount,
      deletedProducts: legacyProducts.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price
      }))
    });
    
  } catch (error) {
    console.error('CLEANUP ERROR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
