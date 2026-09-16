import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DATABASES = ["futuremilestone_admin", "fjord_admin"];

const client = new MongoClient(MONGO_URI, {
  maxPoolSize: 5,
  retryReads: true,
  retryWrites: true,
});

try {
  await client.connect();

  for (const dbName of DATABASES) {
    const db = client.db(dbName);
    const collection = db.collection("sent_emails");

    // Drop any existing non-TTL index on sentAt if present
    try {
      const indexes = await collection.indexes();
      const existingSentAtIndex = indexes.find(
        (idx) => idx.key && idx.key.sentAt && idx.expireAfterSeconds !== 86400
      );
      if (existingSentAtIndex) {
        await collection.dropIndex(existingSentAtIndex.name);
        console.log(`[${dbName}] Dropped older index: ${existingSentAtIndex.name}`);
      }
    } catch (e) {
      // ignore
    }

    // Create TTL index for 86400 seconds (24 hours)
    const indexName = await collection.createIndex(
      { sentAt: 1 },
      { expireAfterSeconds: 86400, name: "sentAt_ttl_24h" }
    );
    console.log(`[${dbName}] Created TTL index on sent_emails: ${indexName}`);

    // Remove any existing records older than 24 hours
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleteResult = await collection.deleteMany({
      sentAt: { $lt: cutoffDate },
    });
    console.log(`[${dbName}] Cleaned up ${deleteResult.deletedCount} old email record(s) older than 24h.`);
  }

  console.log("TTL setup complete!");
} catch (error) {
  console.error("Failed to setup email TTL index:", error);
} finally {
  await client.close();
}
