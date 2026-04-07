import { getDb } from '../_lib/mongodb.js';
import { successResponse, errorResponse, methodNotAllowedResponse } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(methodNotAllowedResponse(['POST']));
  }

  try {
    console.log("USER API: Request received");
    console.log("USER API: Method:", req.method);
    console.log("USER API: Headers:", req.headers);

    const body = req.body;
    console.log("USER API: Request body:", JSON.stringify(body, null, 2));

    if (!body) {
      console.log("USER API: No request body found");
      return res.status(400).json(errorResponse('Request body is required'));
    }

    const { uid, email, name } = body;

    if (!uid || !email || !name) {
      console.log("USER API: Missing required fields");
      console.log("USER API: uid:", !!uid);
      console.log("USER API: email:", !!email);
      console.log("USER API: name:", !!name);
      return res.status(400).json(errorResponse('UID, email, and name are required'));
    }

    console.log("USER API: Connecting to database...");
    const db = await getDb();
    console.log("USER API: Database connected successfully");

    const usersCollection = db.collection('users');
    console.log("USER API: Users collection accessed");

    // Check if user already exists
    console.log("USER API: Checking if user already exists...");
    const existingUser = await usersCollection.findOne({
      $or: [
        { uid: uid },
        { email: email }
      ]
    });

    if (existingUser) {
      console.log("USER API: User already exists, updating...");
      
      // Update existing user with latest info
      const updateResult = await usersCollection.updateOne(
        { uid: uid },
        { 
          $set: {
            name,
            email,
            updatedAt: new Date()
          }
        }
      );

      console.log("USER API: User updated successfully");
      console.log("USER API: Update result:", updateResult);

      return res.status(200).json(successResponse({
        message: 'User updated successfully',
        user: { uid, email, name }
      }));
    }

    // Create new user
    console.log("USER API: Creating new user...");
    const user = {
      uid,
      email,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("USER API: User data:", JSON.stringify(user, null, 2));

    const result = await usersCollection.insertOne(user);

    console.log("USER API: User created successfully");
    console.log("USER API: Insert result:", result);
    console.log("USER API: Inserted ID:", result.insertedId);

    return res.status(201).json(successResponse({
      id: result.insertedId,
      message: 'User created successfully',
      user: { uid, email, name }
    }));

  } catch (error) {
    console.error("USER API ERROR: Error creating/updating user:", error);
    console.error("USER API ERROR: Error stack:", error.stack);
    console.error("USER API ERROR: Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    });

    return res.status(500).json(errorResponse('Failed to create/update user: ' + error.message));
  }
}
