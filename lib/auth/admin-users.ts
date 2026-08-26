import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import { ensureAuthIndexes, getAdminUsersCollection, toObjectId } from "./store";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim()),
  password: z.string().min(8).max(256),
});

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function authenticateAdmin(email: string, password: string): Promise<AuthenticatedAdmin | null> {
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

export interface UpsertAdminUserInput {
  email: string;
  password: string;
  role?: string;
}

export async function upsertAdminUser({ email, password, role = "admin" }: UpsertAdminUserInput): Promise<void> {
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

export async function getAdminById(adminId: string) {
  const admins = await getAdminUsersCollection();
  return admins.findOne({ _id: toObjectId(adminId) });
}
