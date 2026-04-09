import { getDb } from '../_lib/mongodb.js';
import { successResponse, errorResponse } from '../_lib/response.js';
import { validateAddress } from '../_lib/validator.js';
import jwt from 'jsonwebtoken';

function decodeFirebaseToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const users = db.collection('users');

  // ─── GET: fetch user profile ────────────────────────────────────────────────
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json(errorResponse('Unauthorized'));
    const decoded = decodeFirebaseToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json(errorResponse('Invalid token'));
    const uid = decoded.uid || decoded.user_id;
    if (!uid) return res.status(401).json(errorResponse('Invalid token: no uid'));

    try {
      const user = await users.findOne({ uid });
      if (!user) return res.status(404).json(errorResponse('User not found'));
      return res.status(200).json(successResponse(user));
    } catch (err) {
      return res.status(500).json(errorResponse('Server error: ' + err.message));
    }
  }

  // ─── POST: create/sync user OR add address ──────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};

    // If body has uid + email → this is the auth sync call (from AuthContext on login)
    if (body.uid && body.email) {
      const { uid, email, name } = body;
      if (!uid || !email || !name) return res.status(400).json(errorResponse('uid, email, and name are required'));

      try {
        const existing = await users.findOne({ $or: [{ uid }, { email }] });
        if (existing) {
          await users.updateOne({ uid }, { $set: { name, email, updatedAt: new Date() } });
          return res.status(200).json(successResponse({ message: 'User updated', user: { uid, email, name } }));
        }
        const result = await users.insertOne({ uid, email, name, role: 'user', addresses: [], createdAt: new Date(), updatedAt: new Date() });
        return res.status(201).json(successResponse({ id: result.insertedId, message: 'User created', user: { uid, email, name } }));
      } catch (err) {
        return res.status(500).json(errorResponse('Failed to create/update user: ' + err.message));
      }
    }

    // Otherwise → add address (requires auth)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json(errorResponse('Unauthorized'));
    const decoded = decodeFirebaseToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json(errorResponse('Invalid token'));
    const uid = decoded.uid || decoded.user_id;
    if (!uid) return res.status(401).json(errorResponse('Invalid token: no uid'));

    const validation = validateAddress(body);
    if (!validation.isValid) return res.status(400).json(errorResponse('Validation failed', validation.errors));

    try {
      const isDefault = !!body.isDefault;
      const newAddress = {
        id: generateId(),
        fullName: body.fullName.trim(),
        phone: body.phone.trim().replace(/\D/g, ''),
        addressLine1: body.addressLine1.trim(),
        addressLine2: (body.addressLine2 || '').trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        pincode: body.pincode.trim(),
        landmark: (body.landmark || '').trim(),
        isDefault,
        createdAt: new Date().toISOString(),
      };

      const user = await users.findOne({ uid });
      if (!user) return res.status(404).json(errorResponse('User not found'));

      const existingAddresses = (user.addresses || []).map(a =>
        isDefault ? { ...a, isDefault: false } : a
      );

      await users.updateOne(
        { uid },
        { $set: { addresses: [...existingAddresses, newAddress], updatedAt: new Date() } }
      );
      return res.status(201).json(successResponse({ address: newAddress }));
    } catch (err) {
      return res.status(500).json(errorResponse('Server error: ' + err.message));
    }
  }

  // ─── PATCH: update profile OR set default address ───────────────────────────
  if (req.method === 'PATCH') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json(errorResponse('Unauthorized'));
    const decoded = decodeFirebaseToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json(errorResponse('Invalid token'));
    const uid = decoded.uid || decoded.user_id;
    if (!uid) return res.status(401).json(errorResponse('Invalid token: no uid'));

    const body = req.body || {};

    // Set default address
    if (body.action === 'set_default_address') {
      const { id } = body;
      if (!id) return res.status(400).json(errorResponse('Address id required'));
      try {
        const user = await users.findOne({ uid });
        if (!user) return res.status(404).json(errorResponse('User not found'));
        const updated = (user.addresses || []).map(a => ({ ...a, isDefault: a.id === id }));
        await users.updateOne({ uid }, { $set: { addresses: updated, updatedAt: new Date() } });
        return res.status(200).json(successResponse({ message: 'Default address updated' }));
      } catch (err) {
        return res.status(500).json(errorResponse('Server error: ' + err.message));
      }
    }

    // Update profile (name / phone)
    try {
      const { name, phone } = body;
      const update = { updatedAt: new Date() };
      if (name?.trim()) update.name = name.trim();
      if (phone?.trim()) update.phone = phone.trim().replace(/\D/g, '');
      await users.updateOne({ uid }, { $set: update });
      const updatedUser = await users.findOne({ uid });
      return res.status(200).json(successResponse(updatedUser));
    } catch (err) {
      return res.status(500).json(errorResponse('Server error: ' + err.message));
    }
  }

  // ─── DELETE: remove address ──────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json(errorResponse('Unauthorized'));
    const decoded = decodeFirebaseToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json(errorResponse('Invalid token'));
    const uid = decoded.uid || decoded.user_id;
    if (!uid) return res.status(401).json(errorResponse('Invalid token: no uid'));

    const { id } = req.body || {};
    if (!id) return res.status(400).json(errorResponse('Address id required'));

    try {
      await users.updateOne(
        { uid },
        { $pull: { addresses: { id } }, $set: { updatedAt: new Date() } }
      );
      return res.status(200).json(successResponse({ message: 'Address removed' }));
    } catch (err) {
      return res.status(500).json(errorResponse('Server error: ' + err.message));
    }
  }

  return res.status(405).json(errorResponse('Method not allowed'));
}
