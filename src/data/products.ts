import jeansPlaceholder from '@/assets/jeans.webp';
import jeansSide from '@/assets/jeans-side.png';
import jeansDetail from '@/assets/jeans-detail.png';

// Category specific imports (from new categories folder)
import catBootcutImg from '@/assets/categories/bootcut.webp';
import catStraightImg from '@/assets/categories/straightfit.webp';
import catMomFitImg from '@/assets/categories/momfit.jpg';
import catBaggyImg from '@/assets/categories/baggy.webp';
import catTrousersImg from '@/assets/categories/trousers.webp';
import catDistressedImg from '@/assets/categories/distressed.webp';

// Product specific imports (from old categories, now in jeans folder)
import prodBootcutImg from '@/assets/jeans/bootcut.webp';
import prodStraightImg from '@/assets/jeans/straightfit.webp';
import prodMonkImg from '@/assets/jeans/monkfit.webp';
import prodBaggyImg from '@/assets/jeans/baggy.webp';
import prodStretchImg from '@/assets/jeans/stretch.webp';
import prodDistressedImg from '@/assets/jeans/distressed.webp';

export const CATEGORY_IMAGES: Record<string, string> = {
  bootcut: catBootcutImg,
  straight: catStraightImg,
  momfit: catMomFitImg,
  baggy: catBaggyImg,
  trousers: catTrousersImg,
  distressed: catDistressedImg,
};

export const PRODUCT_IMAGES: Record<string, string> = {
  bootcut: prodBootcutImg,
  straight: prodStraightImg,
  momfit: prodMonkImg,
  baggy: prodBaggyImg,
  trousers: prodStretchImg,
  distressed: prodDistressedImg,
};

export const CATEGORIES: Record<string, string> = {
  bootcut: 'Bootcut',
  straight: 'Straight Fit',
  momfit: 'Mom Fit',
  baggy: 'Baggy',
  trousers: 'Trousers',
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
    images: [PRODUCT_IMAGES[categoryId] || jeansPlaceholder, jeansSide, jeansDetail],
    categoryId: categoryId,
  }));
});
