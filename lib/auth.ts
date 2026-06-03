import { Redis } from "@upstash/redis";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ═══ Redis ═══
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ═══ JWT ═══
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");
const COOKIE_NAME = "pm_token";

export async function signToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.email as string;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ═══ Verification Code ═══
export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveCode(email: string, code: string): Promise<void> {
  await redis.set(`code:${email}`, code, { ex: 300 }); // 5 min expiry
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const stored = await redis.get(`code:${email}`);
  if (stored === code) {
    await redis.del(`code:${email}`);
    return true;
  }
  return false;
}

// ═══ User ═══
export interface User {
  email: string;
  created_at: string;
  membership_type: "free" | "premium";
  membership_expire_at: string | null;
}

export async function getOrCreateUser(email: string): Promise<User> {
  const key = `user:${email}`;
  const existing = await redis.get<User>(key);
  if (existing) return existing;
  const user: User = {
    email,
    created_at: new Date().toISOString(),
    membership_type: "free",
    membership_expire_at: null,
  };
  await redis.set(key, user);
  return user;
}

// ═══ Cookie ═══
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export { redis };
