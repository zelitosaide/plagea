import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { ObjectId, type Db } from "mongodb";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export type UserRole = "admin" | "user";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

export const SESSION_COOKIE_NAME = "plagea_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function resolveSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Please add your session signing secret to the SESSION_SECRET environment variable.");
  }

  // Local dev-only fallback, never used in production.
  return new TextEncoder().encode("dev-only-insecure-secret-change-me");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(resolveSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, resolveSecret());
    const { sub, email, name, role } = payload as Record<string, unknown>;

    if (typeof sub !== "string" || typeof email !== "string" || typeof name !== "string" || (role !== "admin" && role !== "user")) {
      return null;
    }

    return { sub, email, name, role };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function getSessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

type AdminSessionSuccess = { ok: true; db: Db; session: SessionPayload };
type AdminSessionFailure = { ok: false; response: NextResponse };

/**
 * Re-checks role/isActive against the database, since the Proxy only checked
 * the JWT claim. Used by the admin user-management routes, which are
 * sensitive enough to warrant the extra lookup.
 */
export async function requireAdminSession(request: NextRequest): Promise<AdminSessionSuccess | AdminSessionFailure> {
  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { db } = await connectToDatabase();
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.sub) });

  if (!user || !user.isActive || user.role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, db, session };
}
