import { getDb } from '../_lib/mongodb.js';
import { validateAddress } from '../_lib/validator.js';
import { successResponse, errorResponse, validationErrorResponse } from '../_lib/response.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const userId = req.query.userId;
      
      const db = await getDb();
      const addressCollection = db.collection('addresses');
      
      const query = userId ? { userId } : {};
      const addresses = await addressCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      
      if (addresses.length === 0) {
        return res.status(200).json(successResponse(null));
      }
      
      return res.status(200).json(successResponse(addresses[0]));
    } else if (req.method === 'POST') {
      const body = req.body;
      
      const addressValidation = validateAddress(body);
      if (!addressValidation.isValid) {
        return res.status(400).json(validationErrorResponse(addressValidation.errors));
      }
      
      const db = await getDb();
      const addressCollection = db.collection('addresses');
      
      const address = {
        userId: body.userId || null,
        fullName: body.fullName,
        phone: body.phone,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || '',
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        landmark: body.landmark || '',
        createdAt: new Date()
      };
      
      const result = await addressCollection.insertOne(address);
      
      return res.status(201).json(successResponse({
        id: result.insertedId,
        message: 'Address saved successfully'
      }));
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Allowed methods: GET, POST'
      });
    }
  } catch (error) {
    console.error('Error in address API:', error);
    return res.status(500).json(errorResponse('Failed to process address request'));
  }
}
