import { getDb } from '../_lib/mongodb.js';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isRateLimited } from '../_lib/rateLimit.js';

/**
 * Reviews API — collection routes
 *
 * GET  /api/reviews?productId=xxx        → public list of active reviews for a product (latest first)
 * GET  /api/reviews?mine=true            → authenticated user's own active reviews (used by Orders page)
 * POST /api/reviews                      → create a review (eligibility checked: user must own a delivered order containing the product)
 *
 * Single-review-per-(user, product) is enforced at the application level:
 * if a non-deleted review already exists, POST returns 409 with the existing review,
 * so the client can switch to "edit" mode via PUT /api/reviews/manage?id=...
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    const database = await getDb();
    const reviewsCollection = database.collection('reviews');

    if (req.method === 'GET') {
      const { productId, mine } = req.query;

      // Authenticated path: fetch the current user's own reviews
      if (mine === 'true' || mine === '1') {
        const decoded = await authUser(req);
        if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

        const query = { userId: decoded.email, isDeleted: { $ne: true } };
        if (productId) query.productId = String(productId);

        const reviews = await reviewsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        return res.status(200).json({ reviews });
      }

      // Public path: requires productId
      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }

      const reviews = await reviewsCollection
        .find({ productId: String(productId), isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      const decoded = await authUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

      const userId = decoded.email;
      const { productId, rating, comment } = req.body || {};

      // ── Validation ────────────────────────────────────────────────────────
      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'productId is required' });
      }
      const ratingNum = Number(rating);
      if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }
      const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : '';

      // ── Eligibility: user must have a DELIVERED order containing this product ─
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

      // ── Duplicate check: one active review per (user, product) ──────────────
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

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('REVIEWS API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

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
