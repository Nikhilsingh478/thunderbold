import { getDb } from '../_lib/mongodb';
import { validateOrder, validateAddress } from '../_lib/validator';
import { successResponse, errorResponse, validationErrorResponse, methodNotAllowedResponse } from '../_lib/response';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.product || !body.address) {
      return errorResponse('Product and address are required');
    }
    
    const orderValidation = validateOrder(body);
    if (!orderValidation.isValid) {
      return validationErrorResponse(orderValidation.errors);
    }
    
    const addressValidation = validateAddress(body.address);
    if (!addressValidation.isValid) {
      return validationErrorResponse(addressValidation.errors);
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
    
    return successResponse({
      id: result.insertedId,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return errorResponse('Failed to create order');
  }
}

export async function GET(request: Request) {
  return methodNotAllowedResponse(['POST']);
}
