export interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  categoryId: string;
  stock?: number;
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
  console.log('PRODUCT FETCH: Fetching from API...');
  
  try {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log('PRODUCT FETCH: API success, products:', data.products.length);
    return data;
  } catch (error) {
    console.error('PRODUCT FETCH: API failed:', error);
    throw error;
  }
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.products.find((product: Product) => product._id === id) || null;
  } catch (error) {
    console.error('PRODUCT FETCH: Failed to fetch product:', error);
    return null;
  }
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.products.filter((product: Product) => product.categoryId === category);
  } catch (error) {
    console.error('PRODUCT FETCH: Failed to fetch category products:', error);
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
