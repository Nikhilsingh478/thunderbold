import { getDb } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isRateLimited } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('ORDERS API: Starting request...');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = await verifyFirebaseToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!decoded?.email) return res.status(401).json({ error: 'Unauthorized' });
    const userId = decoded.email;

    console.log('ORDERS API: User ID:', userId);

    const database = await getDb();
    const ordersCollection = database.collection('orders');
    const productsCollection = database.collection('products');

    const { products, address, paymentMethod, clientOrderId } = req.body;

    // ── Idempotency check ──────────────────────────────────────────────────────
    if (clientOrderId) {
      const existing = await ordersCollection.findOne({ clientOrderId });
      if (existing) {
        console.log('ORDERS API: Duplicate order detected, returning existing:', existing._id);
        return res.status(200).json({
          message: 'Order already created',
          orderId: existing._id,
          order: existing,
        });
      }
    }

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products are required' });
    }
    if (!address || !address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
      return res.status(400).json({ error: 'Complete address is required' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const validProducts = products.every(p =>
      p.productId && p.name &&
      typeof p.price === 'number' &&
      p.image && p.size &&
      typeof p.quantity === 'number' && p.quantity > 0
    );
    if (!validProducts) {
      return res.status(400).json({ error: 'Invalid product structure' });
    }

    // ── Pre-flight stock check ─────────────────────────────────────────────────
    const dbProductsMap = new Map();
    for (const item of products) {
      let dbProduct = null;
      try { dbProduct = await productsCollection.findOne({ _id: new ObjectId(item.productId) }); }
      catch { dbProduct = await productsCollection.findOne({ _id: item.productId }); }

      if (!dbProduct) return res.status(400).json({ error: `Product "${item.name}" not found` });
      dbProductsMap.set(item.productId, dbProduct);

      // Use size-specific stock if available, otherwise fall back to total stock
      let available;
      if (dbProduct.sizeStock && typeof dbProduct.sizeStock === 'object' && item.size in dbProduct.sizeStock) {
        available = dbProduct.sizeStock[item.size];
      } else {
        available = typeof dbProduct.stock === 'number' ? dbProduct.stock : 0;
      }

      if (available < item.quantity) {
        return res.status(400).json({
          error: available === 0
            ? `"${item.name}" (size ${item.size}) is out of stock`
            : `Only ${available} unit(s) of "${item.name}" in size ${item.size} are available`,
        });
      }
    }

    // ── Create order ───────────────────────────────────────────────────────────
    const order = {
      userId,
      products,
      address,
      paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      totalAmount: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
      ...(clientOrderId ? { clientOrderId } : {}),
    };

    let result;
    try {
      result = await ordersCollection.insertOne(order);
    } catch (insertError) {
      if (insertError.code === 11000 && clientOrderId) {
        const existing = await ordersCollection.findOne({ clientOrderId });
        if (existing) {
          console.log('ORDERS API: E11000 duplicate — returning existing order:', existing._id);
          return res.status(200).json({
            message: 'Order already created',
            orderId: existing._id,
            order: existing,
          });
        }
      }
      throw insertError;
    }
    console.log('ORDERS API: Order created:', result.insertedId);

    // ── Atomic stock decrement with compensation rollback ──────────────────────
    const decremented = [];
    let stockError = null;

    for (const item of products) {
      let productObjectId;
      try { productObjectId = new ObjectId(item.productId); }
      catch { productObjectId = item.productId; }

      const dbProduct = dbProductsMap.get(item.productId);
      const hasSizeStock = dbProduct?.sizeStock && typeof dbProduct.sizeStock === 'object' && item.size in dbProduct.sizeStock;

      const updateFilter = hasSizeStock
        ? { _id: productObjectId, [`sizeStock.${item.size}`]: { $gte: item.quantity } }
        : { _id: productObjectId, stock: { $gte: item.quantity } };

      const updateOp = hasSizeStock
        ? { $inc: { [`sizeStock.${item.size}`]: -item.quantity, stock: -item.quantity } }
        : { $inc: { stock: -item.quantity } };

      const updateResult = await productsCollection.updateOne(updateFilter, updateOp);

      if (updateResult.modifiedCount === 0) {
        stockError = `Stock changed for "${item.name}" (size ${item.size}) — please retry`;
        break;
      }

      decremented.push({ id: productObjectId, quantity: item.quantity, size: item.size, hasSizeStock });
    }

    if (stockError) {
      // Compensate: restore all decrements made so far
      for (const prev of decremented) {
        const restoreOp = prev.hasSizeStock
          ? { $inc: { [`sizeStock.${prev.size}`]: prev.quantity, stock: prev.quantity } }
          : { $inc: { stock: prev.quantity } };
        await productsCollection.updateOne({ _id: prev.id }, restoreOp);
      }
      // Also remove the created order
      await ordersCollection.deleteOne({ _id: result.insertedId });
      return res.status(409).json({ error: stockError });
    }

    console.log('ORDERS API: Stock decremented for all products');

    return res.status(201).json({
      message: 'Order created successfully',
      orderId: result.insertedId,
      order,
    });

  } catch (error) {
    console.error('ORDERS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
