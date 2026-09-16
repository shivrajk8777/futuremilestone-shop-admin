import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerEnv } from "../env";
import {
  ensureAuthIndexes,
  getAdminSessionsCollection,
  getAdminUsersCollection,
  toObjectId,
} from "./store";

export interface AdminUserSession {
  admin: {
    id: string;
    email: string;
    role: string;
  };
  sessionId: string;
}

function createSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getExpiryDate(): Date {
  const { ADMIN_SESSION_TTL_HOURS } = getServerEnv();
  return new Date(Date.now() + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);
}

export async function createAdminSession(adminId: string): Promise<void> {
  await ensureAuthIndexes();

  const sessionToken = createSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = getExpiryDate();
  const sessions = await getAdminSessionsCollection();

  await sessions.insertOne({
    adminId: toObjectId(adminId),
    tokenHash,
    createdAt: new Date(),
    expiresAt,
  });

  const cookieStore = await cookies();
  const { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_TTL_HOURS } = getServerEnv();

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: ADMIN_SESSION_TTL_HOURS * 60 * 60,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const { ADMIN_SESSION_COOKIE_NAME } = getServerEnv();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const sessions = await getAdminSessionsCollection();

    await sessions.deleteOne({
      tokenHash: hashSessionToken(sessionToken),
    });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

export const getCurrentAdminSession = cache(async (): Promise<AdminUserSession | null> => {
  await ensureAuthIndexes();

  const cookieStore = await cookies();
  const { ADMIN_SESSION_COOKIE_NAME } = getServerEnv();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const sessions = await getAdminSessionsCollection();
  const session = await sessions.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
    return null;
  }

  const admins = await getAdminUsersCollection();
  const admin = await admins.findOne(
    { _id: session.adminId },
    {
      projection: {
        email: 1,
        role: 1,
        createdAt: 1,
      },
    },
  );

  if (!admin) {
    await sessions.deleteOne({ _id: session._id });
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
    return null;
  }

  return {
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role ?? "admin",
    },
    sessionId: session._id.toString(),
  };
});

export async function requireAdminSession(): Promise<AdminUserSession> {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
