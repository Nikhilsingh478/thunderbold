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
  next();
});
app.use(express.json());

app.use('/api/orders/create', async (req, res) => {
  try {
    const { default: handler } = await import('./api/orders/create.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders/create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/orders/cancel', async (req, res) => {
  try {
    const { default: handler } = await import('./api/orders/cancel.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders/cancel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/orders/manage', async (req, res) => {
  try {
    const { default: handler } = await import('./api/orders/manage.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders/manage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

app.use('/api/products/:id', async (req, res) => {
  try {
    const { default: handler } = await import('./api/products/[id].js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in products/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/products', async (req, res) => {
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

app.use('/api/categories/:id', async (req, res) => {
  try {
    req.query.id = req.params.id;
    const { default: handler } = await import('./api/categories/[id].js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in categories/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/categories', async (req, res) => {
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

app.use('/api/reviews/manage', async (req, res) => {
  try {
    const { default: handler } = await import('./api/reviews/manage.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in reviews/manage:', error);
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
});
