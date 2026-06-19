// Auth primitives: scrypt password hashing + an HMAC-signed session cookie.
// No external auth dep. Prototype-grade but real: passwords are salted+hashed,
// the cookie is signed (tamper-evident) and httpOnly. Set SESSION_SECRET in prod.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { loadDB } from "./db";
import type { User } from "./types";

const COOKIE = "vl_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.SESSION_SECRET || "vandyloop-dev-secret-change-me";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// Token = `${userId}.${issuedAtSec}.${hmac(userId.issuedAtSec)}`. The issued-at is
// signed, so the server can expire a session even if the client keeps the cookie
// (maxAge is only a client-side hint). userIds contain no ".", so the split is safe.
function sign(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000).toString(36)}`;
  const mac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function unsign(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const sep = payload.lastIndexOf(".");
  if (sep < 0) return null;
  const userId = payload.slice(0, sep);
  const issued = parseInt(payload.slice(sep + 1), 36);
  if (!userId || !Number.isFinite(issued)) return null;
  if (Date.now() / 1000 - issued > MAX_AGE) return null; // server-side expiry
  return userId;
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const userId = unsign(store.get(COOKIE)?.value);
  if (!userId) return null;
  return (await loadDB()).users.find((u) => u.id === userId) ?? null;
}
