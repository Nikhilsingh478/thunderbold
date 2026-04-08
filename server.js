import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// API routes
app.use('/api/orders/create', async (req, res) => {
  try {
    const { default: handler } = await import('../api/orders/create.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders/create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/orders/cancel', async (req, res) => {
  try {
    const { default: handler } = await import('../api/orders/cancel.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in orders/cancel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/users/create', async (req, res) => {
  try {
    // Import the handler dynamically
    const { default: handler } = await import('../api/users/create.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in users/create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/products', async (req, res) => {
  try {
    // Import the handler dynamically
    const { default: handler } = await import('../api/products/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log('Serving API endpoints:');
  console.log('  POST /api/orders/create');
  console.log('  POST /api/users/create');
  console.log('  GET /api/products');
});
