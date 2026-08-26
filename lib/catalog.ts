import "server-only";
import fs from "fs";
import path from "path";
import type { Product } from "./types";
import { baseAll } from "./catalogData";

/** Runtime overrides — products created in the admin dashboard are persisted
 * to .data/catalog-overrides.json and merged here so they appear in the shop.
 */
let overrideCache: Product[] | null = null;

function overrides(): Product[] {
  if (overrideCache) return overrideCache;
  try {
    const p = path.join(process.cwd(), ".data", "catalog-overrides.json");
    if (fs.existsSync(p)) {
      overrideCache = JSON.parse(fs.readFileSync(p, "utf-8")) as Product[];
    }
  } catch {
    overrideCache = [];
  }
  overrideCache ??= [];
  return overrideCache;
}

export function saveOverride(product: Product): void {
  const list = overrides().filter((p) => p.id !== product.id);
  list.push(product);
  overrideCache = list;
  const p = path.join(process.cwd(), ".data", "catalog-overrides.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(list, null, 2));
}

export function deleteOverride(id: string): void {
  const list = overrides().filter((p) => p.id !== id);
  overrideCache = list;
  const p = path.join(process.cwd(), ".data", "catalog-overrides.json");
  fs.writeFileSync(p, JSON.stringify(list, null, 2));
}

export const catalog = {
  all(): Product[] {
    return [...baseAll.filter((p) => p.active), ...overrides()];
  },
  find(id: string): Product | undefined {
    return baseAll.find((p) => p.id === id) ?? overrides().find((p) => p.id === id);
  },
  byType(type: Product["productType"]): Product[] {
    return catalog.all().filter((p) => p.productType === type && p.active);
  },
  byCategory(cat: Product["category"]): Product[] {
    return catalog.all().filter((p) => p.category === cat && p.active);
  },
  bundles(): Product[] {
    return catalog.all().filter((p) => p.productType === "bundle" && p.active);
  },
  /** Value of all component products for a bundle (for savings display). */
  bundleValue(bundle: Product): number {
    if (!bundle.items) return bundle.priceGhs;
    return bundle.items.reduce((sum, it) => {
      const p = catalog.find(it.productId);
      return sum + (p ? p.priceGhs : 0);
    }, 0);
  },
};

export { FREE_ITEMS } from "./catalogData";
