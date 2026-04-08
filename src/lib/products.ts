import { PRODUCTS } from '../data/products';

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  images: string[];
  categoryId: string;
}

export interface ProductResponse {
  products: Product[];
  count: number;
  source: 'database' | 'local';
}

/**
 * Hybrid product fetching system
 * Tries MongoDB API first, falls back to local products
 */
export async function fetchProducts(): Promise<ProductResponse> {
  try {
    console.log('PRODUCT FETCH: Trying API...');
    const response = await fetch('/api/products');
    
    if (response.ok) {
      const data = await response.json();
      console.log('PRODUCT FETCH: API success, source:', data.source);
      return data;
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error) {
    console.error('PRODUCT FETCH: API failed, using local fallback:', error);
    return {
      products: PRODUCTS,
      count: PRODUCTS.length,
      source: 'local'
    };
  }
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      return data.products.find((product: Product) => product.id === id) || null;
    }
  } catch (error) {
    console.error('PRODUCT FETCH: Failed to fetch product, using local fallback:', error);
  }
  
  // Fallback to local products
  return PRODUCTS.find(product => product.id === id) || null;
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      return data.products.filter((product: Product) => product.categoryId === categoryId);
    }
  } catch (error) {
    console.error('PRODUCT FETCH: Failed to fetch category products, using local fallback:', error);
  }
  
  // Fallback to local products
  return PRODUCTS.filter(product => product.categoryId === categoryId);
}
