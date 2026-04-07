import { getDb } from '../_lib/mongodb.js';
import { successResponse, errorResponse, methodNotAllowedResponse } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(methodNotAllowedResponse(['GET']));
  }

  try {
    const db = await getDb();
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).toArray();
    
    if (products.length === 0) {
      const fallbackProducts = await getFallbackProducts();
      return res.status(200).json(successResponse(fallbackProducts));
    }
    
    return res.status(200).json(successResponse(products));
  } catch (error) {
    console.error('Error fetching products:', error);
    const fallbackProducts = await getFallbackProducts();
    return res.status(200).json(successResponse(fallbackProducts));
  }
}

async function getFallbackProducts() {
  try {
    const { PRODUCTS } = await import('../../src/data/products.js');
    return PRODUCTS.map(product => ({
      _id: product.id,
      name: product.name,
      category: product.categoryId,
      price: product.price,
      images: product.images,
      sizes: ['28', '30', '32', '34', '36'],
      createdAt: new Date()
    }));
  } catch (error) {
    console.error('Error loading fallback products:', error);
    return [];
  }
}
