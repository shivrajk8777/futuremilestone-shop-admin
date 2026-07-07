import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DATABASE_NAME = "fjord_admin";

const client = new MongoClient(MONGO_URI, {
  maxPoolSize: 5,
  retryReads: true,
  retryWrites: true,
});

try {
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const partners = db.collection("delivery_partners");

  // Create unique index on code
  await partners.createIndex({ code: 1 }, { unique: true, sparse: true });

  const dhlDoc = {
    name: "DHL Express",
    code: "dhl",
    transitTime: "2-4 business days",
    price: 15.00,
    active: true,
    logo: "✈️",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Upsert DHL Express by code
  const result = await partners.updateOne(
    { code: "dhl" },
    { $set: dhlDoc },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log("Successfully seeded DHL Express!");
  } else {
    console.log("DHL Express partner updated successfully!");
  }
} catch (error) {
  console.error("Failed to seed DHL Express:", error);
} finally {
  await client.close();
}
