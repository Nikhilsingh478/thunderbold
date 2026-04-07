import { getDb } from '../_lib/mongodb.js';
import { validateOrder, validateAddress } from '../_lib/validator.js';
import { successResponse, errorResponse, validationErrorResponse, methodNotAllowedResponse } from '../_lib/response.js';

export default async function handler(req, res) {
  console.log("ORDER API: Request received");
  console.log("ORDER API: Method:", req.method);
  console.log("ORDER API: Headers:", req.headers);
  
  if (req.method !== 'POST') {
    console.log("ORDER API: Method not allowed");
    return res.status(405).json(methodNotAllowedResponse(['POST']));
  }

  try {
    console.log("ORDER API: Parsing request body...");
    const body = req.body;
    console.log("ORDER API: Request body:", JSON.stringify(body, null, 2));
    
    if (!body) {
      console.log("ORDER API: No request body found");
      return res.status(400).json(errorResponse('Request body is required'));
    }
    
    if (!body.product || !body.address) {
      console.log("ORDER API: Missing required fields - product or address");
      console.log("ORDER API: product:", body.product);
      console.log("ORDER API: address:", body.address);
      return res.status(400).json(errorResponse('Product and address are required'));
    }
    
    console.log("ORDER API: Validating order data...");
    const orderValidation = validateOrder(body);
    if (!orderValidation.isValid) {
      console.log("ORDER API: Order validation failed:", orderValidation.errors);
      return res.status(400).json(validationErrorResponse(orderValidation.errors));
    }
    
    console.log("ORDER API: Validating address data...");
    const addressValidation = validateAddress(body.address);
    if (!addressValidation.isValid) {
      console.log("ORDER API: Address validation failed:", addressValidation.errors);
      return res.status(400).json(validationErrorResponse(addressValidation.errors));
    }
    
    console.log("ORDER API: Connecting to database...");
    const db = await getDb();
    console.log("ORDER API: Database connected successfully");
    
    const ordersCollection = db.collection('orders');
    console.log("ORDER API: Orders collection accessed");
    
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
    
    console.log("ORDER API: Inserting order into database...");
    console.log("ORDER API: Order data:", JSON.stringify(order, null, 2));
    
    const result = await ordersCollection.insertOne(order);
    
    console.log("ORDER API: Order inserted successfully");
    console.log("ORDER API: Insert result:", result);
    console.log("ORDER API: Inserted ID:", result.insertedId);
    
    return res.status(201).json(successResponse({
      id: result.insertedId,
      message: 'Order created successfully'
    }));
  } catch (error) {
    console.error("ORDER API ERROR: Error creating order:", error);
    console.error("ORDER API ERROR: Error stack:", error.stack);
    console.error("ORDER API ERROR: Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    return res.status(500).json(errorResponse('Failed to create order: ' + error.message));
  }
}
