import { getDb } from '../_lib/mongodb';
import { successResponse, errorResponse, methodNotAllowedResponse } from '../_lib/response';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).toArray();
    
    if (products.length === 0) {
      const fallbackProducts = await getFallbackProducts();
      return successResponse(fallbackProducts);
    }
    
    return successResponse(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    const fallbackProducts = await getFallbackProducts();
    return successResponse(fallbackProducts);
  }
}

async function getFallbackProducts() {
  try {
    const { PRODUCTS } = await import('../../src/data/products');
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

export async function POST(request: Request) {
  return methodNotAllowedResponse(['GET']);
}
