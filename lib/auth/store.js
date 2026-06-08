import { ObjectId } from "mongodb";
import { getDatabase } from "../mongodb";

let indexesReadyPromise;

export async function getAdminUsersCollection() {
  const database = await getDatabase();
  return database.collection("admin_users");
}

export async function getAdminSessionsCollection() {
  const database = await getDatabase();
  return database.collection("admin_sessions");
}

export async function ensureAuthIndexes() {
  if (!indexesReadyPromise) {
    indexesReadyPromise = Promise.all([
      getAdminUsersCollection().then((collection) =>
        collection.createIndex({ emailNormalized: 1 }, { unique: true }),
      ),
      getAdminSessionsCollection().then((collection) =>
        Promise.all([
          collection.createIndex({ tokenHash: 1 }, { unique: true }),
          collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          collection.createIndex({ adminId: 1 }),
        ]),
      ),
    ]);
  }

  await indexesReadyPromise;
}

export function toObjectId(value) {
  return typeof value === "string" ? new ObjectId(value) : value;
}
