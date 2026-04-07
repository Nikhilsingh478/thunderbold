import { getDb } from '../_lib/mongodb';
import { validateAddress } from '../_lib/validator';
import { successResponse, errorResponse, validationErrorResponse } from '../_lib/response';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    const db = await getDb();
    const addressCollection = db.collection('addresses');
    
    const query = userId ? { userId } : {};
    const addresses = await addressCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (addresses.length === 0) {
      return successResponse(null);
    }
    
    return successResponse(addresses[0]);
  } catch (error) {
    console.error('Error fetching address:', error);
    return errorResponse('Failed to fetch address');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const addressValidation = validateAddress(body);
    if (!addressValidation.isValid) {
      return validationErrorResponse(addressValidation.errors);
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
    
    return successResponse({
      id: result.insertedId,
      message: 'Address saved successfully'
    });
  } catch (error) {
    console.error('Error saving address:', error);
    return errorResponse('Failed to save address');
  }
}
