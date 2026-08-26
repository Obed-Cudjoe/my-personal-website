import { cookies } from "next/headers";
import { sign, verify } from "./util";
import { catalog } from "./catalog";
import type { CartItem, FileFormat, Product } from "./types";

const CART_COOKIE = "cds_cart";
const CART_TTL = 30 * 86400;

export interface CartLine extends CartItem {
  product: Product;
  title: string;
  unitPrice: number;
  total: number;
}

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  const payload = verify(raw, CART_TTL);
  if (!payload) return [];
  try {
    const items = JSON.parse(payload) as CartItem[];
    return items.filter((i) => catalog.find(i.productId)?.active);
  } catch {
    return [];
  }
}

async function saveCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, sign(JSON.stringify(items)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_TTL,
    path: "/",
  });
}

export async function addToCart(productId: string, format: FileFormat): Promise<CartItem[]> {
  const items = await getCart();
  const product = catalog.find(productId);
  if (!product || !product.formats.includes(format)) throw new Error("INVALID_ITEM");
  const existing = items.find((i) => i.productId === productId && i.format === format);
  if (existing) existing.qty = 1;
  else items.push({ productId, format, qty: 1 });
  await saveCart(items);
  return items;
}

export async function updateCartItem(productId: string, format: FileFormat): Promise<CartItem[]> {
  const items = await getCart();
  const idx = items.findIndex((i) => i.productId === productId);
  const product = catalog.find(productId);
  if (!product || !product.formats.includes(format)) throw new Error("INVALID_FORMAT");
  if (idx === -1) items.push({ productId, format, qty: 1 });
  else items[idx].format = format;
  await saveCart(items);
  return items;
}

export async function removeFromCart(productId: string): Promise<CartItem[]> {
  const items = await getCart();
  await saveCart(items.filter((i) => i.productId !== productId));
  return items;
}

export async function clearCart(): Promise<void> {
  await saveCart([]);
}

export async function cartLines(): Promise<CartLine[]> {
  const items = await getCart();
  return items
    .map((i) => {
      const product = catalog.find(i.productId);
      if (!product) return null;
      return {
        ...i,
        product,
        title: product.title,
        unitPrice: product.priceGhs,
        total: product.priceGhs * i.qty,
      };
    })
    .filter((x): x is CartLine => x !== null);
}

export async function cartTotal(): Promise<number> {
  const lines = await cartLines();
  return lines.reduce((s, l) => s + l.total, 0);
}

/** Sign a cart snapshot so a lost cookie can be restored (guest -> user merge). */
export function cartSignature(items: CartItem[]): string {
  return sign(JSON.stringify(items));
}
