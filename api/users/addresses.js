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
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, PATCH, OPTIONS');
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

    if (req.method === 'POST') {
      const body = req.body || {};
      const validation = validateAddress(body);
      if (!validation.isValid) {
        return res.status(400).json(errorResponse('Validation failed', validation.errors));
      }

      const isDefault = !!body.isDefault;

      const newAddress = {
        id: generateId(),
        fullName: body.fullName.trim(),
        phone: body.phone.trim(),
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
        {
          $set: {
            addresses: [...existingAddresses, newAddress],
            updatedAt: new Date(),
          },
        }
      );

      return res.status(201).json(successResponse({ address: newAddress }));
    }

    if (req.method === 'DELETE') {
      const addressId = req.body?.id || req.query?.id;
      if (!addressId) return res.status(400).json(errorResponse('Address ID required'));

      await users.updateOne(
        { uid },
        {
          $pull: { addresses: { id: addressId } },
          $set: { updatedAt: new Date() },
        }
      );

      return res.status(200).json(successResponse({ message: 'Address removed' }));
    }

    if (req.method === 'PATCH') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json(errorResponse('Address ID required'));

      const user = await users.findOne({ uid });
      if (!user) return res.status(404).json(errorResponse('User not found'));

      const updatedAddresses = (user.addresses || []).map(a => ({
        ...a,
        isDefault: a.id === id,
      }));

      await users.updateOne(
        { uid },
        { $set: { addresses: updatedAddresses, updatedAt: new Date() } }
      );

      return res.status(200).json(successResponse({ message: 'Default address updated' }));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error) {
    console.error('Addresses API error:', error);
    return res.status(500).json(errorResponse('Server error: ' + error.message));
  }
}
