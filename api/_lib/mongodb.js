import { MongoClient } from 'mongodb';

if (!process.env.MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

export async function getDb() {
  console.log("MONGO: Getting database connection...");
  
  if (global.mongo) {
    console.log("MONGO: Using existing connection");
    return global.mongo.db;
  }

  const mongoUri = process.env.MONGO_URI;
  console.log("MONGO: Checking environment variables...");
  console.log("MONGO: MONGO_URI exists:", !!mongoUri);
  
  if (!mongoUri) {
    console.error("MONGO: MONGO_URI environment variable is not defined");
    throw new Error('MONGO_URI environment variable is not defined');
  }

  console.log("MONGO: Creating new MongoDB client...");
  const client = new MongoClient(mongoUri);
  
  try {
    console.log("MONGO: Connecting to MongoDB...");
    await client.connect();
    const db = client.db('thunderbold');
    console.log("MONGO: Connected to database 'thunderbolt'");
    
    global.mongo = {
      client,
      db
    };
    
    console.log("MONGO: Connection cached in global");
    return db;
  } catch (error) {
    console.error('MONGO: Failed to connect to MongoDB:', error);
    console.error('MONGO: Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    throw error;
  }
}

export async function closeConnection() {
  if (global.mongo) {
    await global.mongo.client.close();
    global.mongo = undefined;
  }
}
