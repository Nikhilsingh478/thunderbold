import { getDb } from '../_lib/mongodb.js';
import { validateOrder, validateAddress } from '../_lib/validator.js';
import { successResponse, errorResponse, validationErrorResponse, methodNotAllowedResponse } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(methodNotAllowedResponse(['POST']));
  }

  try {
    const body = req.body;
    
    if (!body.product || !body.address) {
      return res.status(400).json(errorResponse('Product and address are required'));
    }
    
    const orderValidation = validateOrder(body);
    if (!orderValidation.isValid) {
      return res.status(400).json(validationErrorResponse(orderValidation.errors));
    }
    
    const addressValidation = validateAddress(body.address);
    if (!addressValidation.isValid) {
      return res.status(400).json(validationErrorResponse(addressValidation.errors));
    }
    
    const db = await getDb();
    const ordersCollection = db.collection('orders');
    
    const order = {
      userId: body.userId || null,
      product: {
        name: body.product.name,
        price: body.product.price,
        size: body.product.size,
        quantity: body.product.quantity
      },
      address: {
        fullName: body.address.fullName,
        phone: body.address.phone,
        addressLine1: body.address.addressLine1,
        addressLine2: body.address.addressLine2 || '',
        city: body.address.city,
        state: body.address.state,
        pincode: body.address.pincode,
        landmark: body.address.landmark || ''
      },
      paymentMethod: 'COD',
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await ordersCollection.insertOne(order);
    
    return res.status(201).json(successResponse({
      id: result.insertedId,
      message: 'Order created successfully'
    }));
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json(errorResponse('Failed to create order'));
  }
}
