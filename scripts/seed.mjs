// Seed the demo database: admin user (and demo buyer).
// Run: node scripts/seed.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const DB_DIR = path.join(ROOT, ".data");
const DB = path.join(DB_DIR, "db.json");

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

let db = { users: [], orders: [], payments: [], downloads: [], subscribers: [] };
if (fs.existsSync(DB)) {
  try {
    db = JSON.parse(fs.readFileSync(DB, "utf-8"));
  } catch {
    /* fresh */
  }
}

const admins = [
  { email: "admin@cudjoe.digital", password: "admin123", name: "Store Admin", phone: "0240000000", role: "admin" },
  { email: "buyer@example.com", password: "buyer123", name: "Kofi Buyer", phone: "0241234567", role: "user" },
];

let changed = false;
for (const a of admins) {
  if (!db.users.some((u) => u.email === a.email)) {
    db.users.push({
      id: crypto.randomBytes(8).toString("hex"),
      email: a.email,
      passwordHash: hashPassword(a.password),
      name: a.name,
      phone: a.phone,
      role: a.role,
      createdAt: new Date().toISOString(),
    });
    changed = true;
    console.log("Seeded:", a.email, `/ password: ${a.password}`);
  }
}

if (changed) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  console.log("Database written to .data/db.json");
} else {
  console.log("Users already exist — nothing to seed.");
}
