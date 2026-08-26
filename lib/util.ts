import crypto from "crypto";

/** Secret used to sign session cookies, cart cookies and download tokens. */
export function secret(): string {
  return (
    process.env.APP_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    "dev-secret-change-me-in-production"
  );
}

export function sign(payload: string, ttlSeconds?: number): string {
  const body = ttlSeconds
    ? `${payload}.${Math.floor(Date.now() / 1000) + ttlSeconds}`
    : payload;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify(token: string, maxTtlSeconds?: number): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const body = parts.slice(0, -1).join(".");
  const sig = parts[parts.length - 1];
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const bodyParts = body.split(".");
  if (bodyParts.length === 2 && maxTtlSeconds) {
    const exp = parseInt(bodyParts[1], 10);
    if (Number.isNaN(exp) || Date.now() / 1000 > exp) return null;
  }
  return bodyParts[0];
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export function randomId(len = 10): string {
  return crypto.randomBytes(len).toString("hex").slice(0, len);
}

export function orderNumber(): string {
  return `CDS-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function formatGhs(amount: number): string {
  return `GH₵ ${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}
