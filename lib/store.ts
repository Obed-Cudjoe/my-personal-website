import fs from "fs";
import path from "path";
import { randomId, nowIso } from "./util";
import type {
  DownloadRow,
  Order,
  OrderStatus,
  Payment,
  Subscriber,
  User,
} from "./types";

/**
 * File-backed demo store. Writes to .data/db.json (gitignored).
 * For production scale, swap this module for the Supabase adapter —
 * the interface is identical (see README "Going to production").
 */

interface DbShape {
  users: User[];
  orders: Order[];
  payments: Payment[];
  downloads: DownloadRow[];
  subscribers: Subscriber[];
}

let cache: DbShape | null = null;
let dirty = false;

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

function load(): DbShape {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_PATH)) {
      cache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DbShape;
    }
  } catch {
    cache = null;
  }
  if (!cache) {
    cache = { users: [], orders: [], payments: [], downloads: [], subscribers: [] };
  }
  return cache;
}

function save() {
  if (!dirty) return;
  dirty = false;
  if (!fsWritable) return;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(load(), null, 2));
  } catch (err) {
    fsWritable = false;
    console.warn(
      "[store] filesystem not writable (serverless) — running in-memory. " +
        "Orders will not persist across instances. Use the Supabase adapter for production."
    );
  }
}

let fsWritable = true;

function mutate<T>(fn: () => T): T {
  const out = fn();
  dirty = true;
  save();
  return out;
}

// ---------------- users ----------------
export const users = {
  findByEmail(email: string): User | undefined {
    return load().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findById(id: string): User | undefined {
    return load().users.find((u) => u.id === id);
  },
  create(input: Omit<User, "id" | "createdAt">): User {
    return mutate(() => {
      const user: User = { ...input, id: randomId(16), createdAt: nowIso() };
      load().users.push(user);
      return user;
    });
  },
  update(id: string, patch: Partial<User>): User | undefined {
    return mutate(() => {
      const u = load().users.find((x) => x.id === id);
      if (!u) return undefined;
      Object.assign(u, patch);
      return u;
    });
  },
};

// ---------------- orders ----------------
export const orders = {
  list(): Order[] {
    return [...load().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listByUser(userId: string): Order[] {
    return load()
      .orders.filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listByEmail(email: string): Order[] {
    return load()
      .orders.filter((o) => o.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  find(id: string): Order | undefined {
    return load().orders.find((o) => o.id === id);
  },
  create(order: Order): Order {
    return mutate(() => {
      load().orders.push(order);
      return order;
    });
  },
  update(id: string, patch: Partial<Order>): Order | undefined {
    return mutate(() => {
      const o = load().orders.find((x) => x.id === id);
      if (!o) return undefined;
      Object.assign(o, patch);
      return o;
    });
  },
};

// ---------------- payments ----------------
export const payments = {
  findByReference(ref: string): Payment | undefined {
    return load().payments.find((p) => p.reference === ref);
  },
  findByOrder(orderId: string): Payment | undefined {
    return load().payments.find((p) => p.orderId === orderId);
  },
  create(payment: Payment): Payment {
    return mutate(() => {
      load().payments.push(payment);
      return payment;
    });
  },
  update(id: string, patch: Partial<Payment>): Payment | undefined {
    return mutate(() => {
      const p = load().payments.find((x) => x.id === id);
      if (!p) return undefined;
      Object.assign(p, patch);
      return p;
    });
  },
};

// ---------------- downloads ----------------
export const downloads = {
  listByOrder(orderId: string): DownloadRow[] {
    return load().downloads.filter((d) => d.orderId === orderId);
  },
  listByUser(userId: string): DownloadRow[] {
    const orderIds = new Set(load().orders.filter((o) => o.userId === userId).map((o) => o.id));
    return load().downloads.filter((d) => orderIds.has(d.orderId));
  },
  listByEmail(email: string): DownloadRow[] {
    const orderIds = new Set(load().orders.filter((o) => o.email.toLowerCase() === email.toLowerCase()).map((o) => o.id));
    return load().downloads.filter((d) => orderIds.has(d.orderId));
  },
  upsert(row: DownloadRow): void {
    mutate(() => {
      const existing = load().downloads.find(
        (d) => d.orderId === row.orderId && d.productId === row.productId && d.format === row.format
      );
      if (existing) Object.assign(existing, row);
      else load().downloads.push(row);
    });
  },
  bump(id: string): void {
    mutate(() => {
      const d = load().downloads.find((x) => x.id === id);
      if (d) {
        d.count += 1;
        d.lastDownloadedAt = nowIso();
      }
    });
  },
};

// ---------------- subscribers ----------------
export const subscribers = {
  create(email: string, phone: string, source: string): Subscriber {
    return mutate(() => {
      const s: Subscriber = { id: randomId(16), email, phone, source, createdAt: nowIso() };
      load().subscribers.push(s);
      return s;
    });
  },
  exists(email: string): boolean {
    return load().subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase());
  },
};

export function orderStatusCounts() {
  const counts: Record<string, number> = { pending: 0, paid: 0, failed: 0, refunded: 0 };
  for (const o of load().orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  return counts;
}
