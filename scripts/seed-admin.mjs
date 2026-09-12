import { Algorithm, hash } from "@node-rs/argon2";
import { MongoClient } from "mongodb";

const SEED_CONFIG = {
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  databaseName: process.env.MONGODB_DB || "fjord_admin",
  email: process.env.ADMIN_SEED_EMAIL || "shop.futuremilestone@gmail.com",
  password: process.env.ADMIN_SEED_PASSWORD || "@Shop@skj89",
  role: "admin",
  forceReset: true,
};

if (SEED_CONFIG.password.length < 8) {
  throw new Error("Embedded admin password must be at least 8 characters.");
}

const client = new MongoClient(SEED_CONFIG.mongoUri, {
  maxPoolSize: 5,
  retryReads: true,
  retryWrites: true,
});

const passwordHash = await hash(SEED_CONFIG.password, {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  parallelism: 1,
  timeCost: 3,
});

try {
  await client.connect();

  const dbsToSeed = Array.from(new Set([SEED_CONFIG.databaseName, "futuremilestone_admin", "fjord_admin"]));

  for (const dbName of dbsToSeed) {
    const database = client.db(dbName);
    const admins = database.collection("admin_users");
    const sessions = database.collection("admin_sessions");
    const normalizedEmail = SEED_CONFIG.email.toLowerCase().trim();

    await admins.createIndex({ emailNormalized: 1 }, { unique: true });
    await sessions.createIndex({ tokenHash: 1 }, { unique: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await sessions.createIndex({ adminId: 1 });

    await admins.updateOne(
      { emailNormalized: normalizedEmail },
      {
        $set: {
          email: SEED_CONFIG.email.trim(),
          emailNormalized: normalizedEmail,
          passwordHash,
          role: SEED_CONFIG.role,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log(`Seeded admin account (${SEED_CONFIG.email}) in database: ${dbName}`);
  }
} finally {
  await client.close();
}

