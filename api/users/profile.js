import { getDb } from '../_lib/mongodb.js';
import { successResponse, errorResponse } from '../_lib/response.js';
import jwt from 'jsonwebtoken';

function decodeFirebaseToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  const token = authHeader.split(' ')[1];
  const decoded = decodeFirebaseToken(token);
  if (!decoded) return res.status(401).json(errorResponse('Invalid token'));

  const uid = decoded.uid || decoded.user_id;
  if (!uid) return res.status(401).json(errorResponse('Invalid token: no uid'));

  try {
    const db = await getDb();
    const users = db.collection('users');

    if (req.method === 'GET') {
      const user = await users.findOne({ uid });
      if (!user) return res.status(404).json(errorResponse('User not found'));
      return res.status(200).json(successResponse(user));
    }

    if (req.method === 'PATCH') {
      const { name, phone } = req.body || {};
      const update = { updatedAt: new Date() };

      if (name && name.trim()) update.name = name.trim();
      if (phone && phone.trim()) update.phone = phone.trim();

      await users.updateOne({ uid }, { $set: update });
      const updated = await users.findOne({ uid });
      return res.status(200).json(successResponse(updated));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json(errorResponse('Server error: ' + error.message));
  }
}
