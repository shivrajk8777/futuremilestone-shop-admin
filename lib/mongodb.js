import { MongoClient } from "mongodb";
import { getServerEnv } from "./env";

const globalForMongo = globalThis;

export async function getMongoClient() {
  const { MONGODB_URI } = getServerEnv();

  if (!globalForMongo.__fjordMongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      retryReads: true,
      retryWrites: true,
    });

    globalForMongo.__fjordMongoClientPromise = client.connect();
  }

  return globalForMongo.__fjordMongoClientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  const { MONGODB_DB } = getServerEnv();

  return client.db(MONGODB_DB);
}
