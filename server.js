import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Security headers (replaces helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://thunderbold.shop https://*.googleusercontent.com",
    "connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com https://fcm.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'self' https://thunderbolt-auth.firebaseapp.com https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '));
  next();
});

// CORS — restrict to known production and dev origins instead of wildcard
const ALLOWED_ORIGINS = [
  'https://thunderbold.shop',
  'https://www.thunderbold.shop',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost:5000',
  'http://localhost:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.use('/api/orders', async (req, res) => {
  try {
    const { default: handler } = await import('./api/orders/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/users', async (req, res) => {
  try {
    const { default: handler } = await import('./api/users/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/products', async (req, res) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }
  try {
    const { default: handler } = await import('./api/products/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/cart', async (req, res) => {
  try {
    const { default: handler } = await import('./api/cart/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/wishlist', async (req, res) => {
  try {
    const { default: handler } = await import('./api/wishlist/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/categories', async (req, res) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }
  try {
    const { default: handler } = await import('./api/categories/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/address', async (req, res) => {
  try {
    const { default: handler } = await import('./api/address/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/admin/analytics', async (req, res) => {
  try {
    const { default: handler } = await import('./api/admin.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in admin/analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/reviews', async (req, res) => {
  try {
    const { default: handler } = await import('./api/reviews/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/brands', async (req, res) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }
  try {
    const { default: handler } = await import('./api/brands/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/slider', async (req, res) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }
  try {
    req.query.subpath = 'slider';
    const { default: handler } = await import('./api/admin.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in slider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/notifications', async (req, res) => {
  try {
    const { default: handler } = await import('./api/notifications/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/returns', async (req, res) => {
  try {
    const { default: handler } = await import('./api/returns/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in returns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log('Serving API endpoints:');
  console.log('  /api/products');
  console.log('  /api/orders');
  console.log('  /api/users/create');
  console.log('  /api/cart');
  console.log('  /api/wishlist');
  console.log('  /api/categories');
  console.log('  /api/address');
  console.log('  /api/reviews');
  console.log('  /api/brands');
});
