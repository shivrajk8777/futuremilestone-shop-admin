import { MongoClient, Db } from "mongodb";
import { getServerEnv } from "./env";

interface GlobalWithMongo {
  __futuremilestoneMongoClientPromise?: Promise<MongoClient>;
}

const globalForMongo = globalThis as unknown as GlobalWithMongo;

export async function getMongoClient(): Promise<MongoClient> {
  const { MONGODB_URI } = getServerEnv();

  if (!globalForMongo.__futuremilestoneMongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      retryReads: true,
      retryWrites: true,
    });

    globalForMongo.__futuremilestoneMongoClientPromise = client.connect();
  }

  return globalForMongo.__futuremilestoneMongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  const { MONGODB_DB } = getServerEnv();

  return client.db(MONGODB_DB);
}
