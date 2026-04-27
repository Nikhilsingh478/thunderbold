import { ObjectId } from 'mongodb';
import { getDb } from '../_lib/mongodb.js';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';
import { isRateLimited } from '../_lib/rateLimit.js';

/**
 * Reviews API — single serverless function (Vercel Hobby has a 12-function cap).
 *
 * GET    /api/reviews?productId=xxx                      → public list of active reviews (latest first)
 * GET    /api/reviews?mine=true                          → current user's active reviews
 * GET    /api/reviews?mine=true&productId=xxx            → user's review for product + eligibility flag
 * POST   /api/reviews                                    → create review (delivered-order check + dedupe)
 * PUT    /api/reviews?id=xxx                             → owner updates rating/comment
 * DELETE /api/reviews?id=xxx                             → soft delete (owner OR admin)
 *
 * One non-deleted review per (user, product) is enforced at the application
 * layer; POST returns 409 + the existing review so the client can switch to edit.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    const database = await getDb();
    const reviewsCollection = database.collection('reviews');

    if (req.method === 'GET') return handleGet(req, res, database, reviewsCollection);
    if (req.method === 'POST') return handleCreate(req, res, database, reviewsCollection);
    if (req.method === 'PUT' || req.method === 'DELETE') {
      return handleManage(req, res, database, reviewsCollection);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('REVIEWS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── GET ────────────────────────────────────────────────────────────────────
async function handleGet(req, res, database, reviewsCollection) {
  const { productId, mine } = req.query;

  // Authenticated path: fetch the current user's own reviews
  if (mine === 'true' || mine === '1') {
    const decoded = await authUser(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const userId = decoded.email;
    const query = { userId, isDeleted: { $ne: true } };
    if (productId) query.productId = String(productId);

    const reviews = await reviewsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    if (productId) {
      const ordersCollection = database.collection('orders');
      const eligibleOrder = await ordersCollection.findOne(
        { userId, status: 'delivered', 'products.productId': String(productId) },
        { projection: { _id: 1 } },
      );
      return res.status(200).json({
        reviews,
        eligible: Boolean(eligibleOrder),
        review: reviews[0] ?? null,
      });
    }

    return res.status(200).json({ reviews });
  }

  // Public path: requires productId
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const reviews = await reviewsCollection
    .find({ productId: String(productId), isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .toArray();

  return res.status(200).json({ reviews });
}

// ── POST ───────────────────────────────────────────────────────────────────
async function handleCreate(req, res, database, reviewsCollection) {
  const decoded = await authUser(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const userId = decoded.email;
  const { productId, rating, comment } = req.body || {};

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId is required' });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }
  const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : '';

  const ordersCollection = database.collection('orders');
  const eligibleOrder = await ordersCollection.findOne({
    userId,
    status: 'delivered',
    'products.productId': productId,
  });

  if (!eligibleOrder) {
    return res.status(403).json({
      error: 'You can only review products from your delivered orders.',
    });
  }

  const existing = await reviewsCollection.findOne({
    userId,
    productId,
    isDeleted: { $ne: true },
  });
  if (existing) {
    return res.status(409).json({
      error: 'You have already reviewed this product. Edit it instead.',
      review: existing,
    });
  }

  const now = new Date();
  const review = {
    userId,
    productId,
    orderId: String(eligibleOrder._id),
    rating: ratingNum,
    comment: cleanComment,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await reviewsCollection.insertOne(review);
  return res.status(201).json({
    message: 'Review submitted',
    review: { _id: result.insertedId, ...review },
  });
}

// ── PUT / DELETE ───────────────────────────────────────────────────────────
async function handleManage(req, res, database, reviewsCollection) {
  const decoded = await authUser(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const userId = decoded.email;

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Review id is required' });

  let reviewObjectId;
  try {
    reviewObjectId = new ObjectId(String(id));
  } catch {
    return res.status(400).json({ error: 'Invalid review id' });
  }

  const review = await reviewsCollection.findOne({ _id: reviewObjectId });
  if (!review || review.isDeleted) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const owner = review.userId === userId;
  const adminUser = await isAdmin(userId, database);

  if (req.method === 'PUT') {
    if (!owner) return res.status(403).json({ error: 'Forbidden' });

    const { rating, comment } = req.body || {};
    const update = { updatedAt: new Date() };

    if (rating !== undefined) {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }
      update.rating = r;
    }
    if (comment !== undefined) {
      if (typeof comment !== 'string') {
        return res.status(400).json({ error: 'Comment must be a string' });
      }
      update.comment = comment.trim().slice(0, 1000);
    }

    await reviewsCollection.updateOne({ _id: reviewObjectId }, { $set: update });
    const updated = await reviewsCollection.findOne({ _id: reviewObjectId });
    return res.status(200).json({ message: 'Review updated', review: updated });
  }

  // DELETE
  if (!owner && !adminUser) return res.status(403).json({ error: 'Forbidden' });

  await reviewsCollection.updateOne(
    { _id: reviewObjectId },
    { $set: { isDeleted: true, updatedAt: new Date() } },
  );
  return res.status(200).json({ message: 'Review deleted' });
}

// ── Shared auth helper ─────────────────────────────────────────────────────
async function authUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await verifyFirebaseToken(authHeader.split(' ')[1]);
    return decoded?.email ? decoded : null;
  } catch {
    return null;
  }
}
