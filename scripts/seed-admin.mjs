import { Algorithm, hash } from "@node-rs/argon2";
import { MongoClient } from "mongodb";

const SEED_CONFIG = {
  mongoUri: "mongodb://127.0.0.1:27017",
  databaseName: "fjord_admin",
  email: "admin@fjord.com",
  password: "password1234",
  role: "admin",
  forceReset: true,
};

if (SEED_CONFIG.password.length < 12) {
  throw new Error("Embedded admin password must be at least 12 characters.");
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

  const database = client.db(SEED_CONFIG.databaseName);
  const admins = database.collection("admin_users");
  const sessions = database.collection("admin_sessions");
  const normalizedEmail = SEED_CONFIG.email.toLowerCase();

  await admins.createIndex({ emailNormalized: 1 }, { unique: true });
  await sessions.createIndex({ tokenHash: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await sessions.createIndex({ adminId: 1 });

  const existingAdmin = await admins.findOne({ emailNormalized: normalizedEmail });

  if (existingAdmin && !SEED_CONFIG.forceReset) {
    console.log(`Admin user already exists for ${SEED_CONFIG.email}.`);
    process.exit(0);
  }

  await admins.updateOne(
    { emailNormalized: normalizedEmail },
    {
      $set: {
        email: SEED_CONFIG.email,
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

  console.log(`Seeded admin account for ${SEED_CONFIG.email}.`);
} finally {
  await client.close();
}
