import jeansPlaceholder from '@/assets/jeans.webp';
import jeansSide from '@/assets/jeans-side.png';
import jeansDetail from '@/assets/jeans-detail.png';

// Category specific imports
import bootcutImg from '@/assets/categories/bootcut.webp';
import straightImg from '@/assets/categories/straightfit.webp';
import monkImg from '@/assets/categories/monkfit.webp';
import baggyImg from '@/assets/categories/baggy.webp';
import stretchImg from '@/assets/categories/stretch.webp';
import distressedImg from '@/assets/categories/distressed.webp';

export const CATEGORY_IMAGES: Record<string, string> = {
  bootcut: bootcutImg,
  straight: straightImg,
  monk: monkImg,
  baggy: baggyImg,
  stretch: stretchImg,
  distressed: distressedImg,
};

export const CATEGORIES: Record<string, string> = {
  bootcut: 'Bootcut',
  straight: 'Straight Fit',
  monk: 'Monk Fit',
  baggy: 'Baggy',
  stretch: 'Stretch',
  distressed: 'Distressed',
};

export const SIZES = ['28', '30', '32', '34', '36'];

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  images: string[];
  categoryId: string;
}

// Generates a mock database of products for all categories automatically.
// Replace this array with a fetch request or JSON import when you move to a real backend.
export const PRODUCTS: Product[] = Object.keys(CATEGORIES).flatMap((categoryId) => {
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `${categoryId}-${i + 1}`,
    name: `Thunderbolt ${CATEGORIES[categoryId]} ${i + 1}`,
    price: '₹ 2,499',
    description: 'Premium stretch denim engineered for comfort and a bold silhouette. Hand-finished details, robust stitching, and durable construction designed to fade beautifully over time.',
    images: [CATEGORY_IMAGES[categoryId] || jeansPlaceholder, jeansSide, jeansDetail],
    categoryId: categoryId,
  }));
});
