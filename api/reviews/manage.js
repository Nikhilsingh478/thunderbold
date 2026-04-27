import { ObjectId } from 'mongodb';
import { getDb } from '../_lib/mongodb.js';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';
import { isRateLimited } from '../_lib/rateLimit.js';

/**
 * Reviews API — single-resource routes
 *
 * PUT    /api/reviews/manage?id=xxx      → owner updates rating/comment
 * DELETE /api/reviews/manage?id=xxx      → soft-delete (owner OR admin)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  if (!['PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = await verifyFirebaseToken(authHeader.split(' ')[1]);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!decoded?.email) return res.status(401).json({ error: 'Unauthorized' });
    const userId = decoded.email;

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Review id is required' });

    let reviewObjectId;
    try {
      reviewObjectId = new ObjectId(String(id));
    } catch {
      return res.status(400).json({ error: 'Invalid review id' });
    }

    const database = await getDb();
    const reviewsCollection = database.collection('reviews');

    const review = await reviewsCollection.findOne({ _id: reviewObjectId });
    if (!review || review.isDeleted) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const owner = review.userId === userId;
    const adminUser = await isAdmin(userId, database);

    if (req.method === 'PUT') {
      // Only owners can edit content
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

    // DELETE — soft delete, allowed for owner or admin
    if (!owner && !adminUser) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await reviewsCollection.updateOne(
      { _id: reviewObjectId },
      { $set: { isDeleted: true, updatedAt: new Date() } },
    );
    return res.status(200).json({ message: 'Review deleted' });
  } catch (error) {
    console.error('REVIEWS MANAGE API ERROR:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
