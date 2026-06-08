import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import { ensureAuthIndexes, getAdminUsersCollection, toObjectId } from "./store";

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim()),
  password: z.string().min(8).max(256),
});

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function authenticateAdmin(email, password) {
  await ensureAuthIndexes();

  const admins = await getAdminUsersCollection();
  const admin = await admins.findOne({ emailNormalized: normalizeEmail(email) });

  if (!admin?.passwordHash) {
    return null;
  }

  const passwordValid = await verifyPassword(admin.passwordHash, password);

  if (!passwordValid) {
    return null;
  }

  await admins.updateOne(
    { _id: admin._id },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role ?? "admin",
  };
}

export async function upsertAdminUser({ email, password, role = "admin" }) {
  await ensureAuthIndexes();

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  const admins = await getAdminUsersCollection();

  await admins.updateOne(
    { emailNormalized: normalizedEmail },
    {
      $set: {
        email: email.trim(),
        emailNormalized: normalizedEmail,
        passwordHash,
        role,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function getAdminById(adminId) {
  const admins = await getAdminUsersCollection();
  return admins.findOne({ _id: toObjectId(adminId) });
}
