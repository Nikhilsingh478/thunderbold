import { cachedFetch } from './apiCache';

export interface ProductHighlights {
  color?: string;
  length?: string;
  printsPattern?: string;
  waistRise?: string;
  shade?: string;
  lengthInches?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  description?: string;
  image: string;
  images?: string[];
  categoryId: string;
  category?: string;
  stock?: number;
  sizeStock?: Record<string, number>;
  highlights?: ProductHighlights | null;
  topwear?: { sizeStock?: Record<string, number>; stock?: number; highlights?: ProductHighlights | null };
  bottomwear?: { sizeStock?: Record<string, number>; stock?: number; highlights?: ProductHighlights | null };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  products: Product[];
  count: number;
  source: 'database';
}

/**
 * Fetch all products from API
 */
export async function fetchProducts(): Promise<ProductResponse> {
  return cachedFetch<ProductResponse>('/api/products');
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  if (!id) return null;
  try {
    const url = `/api/products?id=${encodeURIComponent(id)}`;
    const data = await cachedFetch<{ product?: Product }>(url);
    return data.product || null;
  } catch {
    return null;
  }
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  try {
    const data = await fetchProducts();
    return data.products.filter((p: Product) => p.categoryId === category);
  } catch {
    return [];
  }
}

/**
 * Get unique categories from products
 */
export async function getCategories(): Promise<string[]> {
  const response = await fetchProducts();
  const categories = [...new Set(response.products.map(product => product.categoryId))];
  return categories;
}
