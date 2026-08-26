import { cookies } from "next/headers";
import { sign, verify, daysFromNowIso } from "./util";
import { users } from "./store";
import type { User } from "./types";

const SESSION_COOKIE = "cds_session";
const SESSION_TTL = 30 * 86400; // 30 days

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

function tokenFor(user: User): string {
  return sign(JSON.stringify({ uid: user.id }), SESSION_TTL);
}

export async function createSession(user: User): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, tokenFor(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const raw = verify(token, SESSION_TTL);
  if (!raw) return null;
  try {
    const { uid } = JSON.parse(raw) as { uid: string };
    const user = users.findById(uid);
    if (!user) return null;
    return { userId: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}

/** Guest access key: lets an unauthenticated buyer reach their own orders via a signed cookie. */
const GUEST_COOKIE = "cds_guest";

export function guestKey(email: string): string {
  return sign(email.toLowerCase(), 30 * 86400);
}

export async function setGuest(email: string): Promise<void> {
  const store = await cookies();
  store.set(GUEST_COOKIE, guestKey(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 86400,
    path: "/",
  });
}

export async function getGuestEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(GUEST_COOKIE)?.value;
  if (!token) return null;
  const raw = verify(token, 30 * 86400);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email: string };
    return parsed.email ?? null;
  } catch {
    return null;
  }
}

export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export function sessionExpiryIso(): string {
  return daysFromNowIso(30);
}
