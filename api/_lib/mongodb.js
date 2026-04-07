import { MongoClient } from 'mongodb';

if (!process.env.MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

export async function getDb() {
  if (global.mongo) {
    return global.mongo.db;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('thunderbolt');
    
    global.mongo = {
      client,
      db
    };
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeConnection() {
  if (global.mongo) {
    await global.mongo.client.close();
    global.mongo = undefined;
  }
}
