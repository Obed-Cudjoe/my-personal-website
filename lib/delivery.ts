import fs from "fs";
import path from "path";
import { catalog } from "./catalog";
import { downloads, orders } from "./store";
import { nowIso, randomId, sign, verify } from "./util";
import { sendOrderEmail } from "./email";
import type { FileFormat, Order, Product } from "./types";

/**
 * Delivery engine:
 * - unlocks downloads the moment a payment is confirmed,
 * - issues HMAC-signed download URLs that expire (default 48 h),
 * - streams files with the right MIME type + Range support.
 */

export const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
  zip: "application/zip",
  txt: "text/plain",
  jpg: "image/jpeg",
  png: "image/png",
  jpeg: "image/jpeg",
};

export function downloadTtlSeconds(): number {
  const raw = process.env.DOWNLOAD_LINK_TTL_SECONDS;
  const parsed = raw ? parseInt(raw, 10) : 172800; // 48 h default
  return parsed > 0 && parsed <= 604800 ? parsed : 172800;
}

export interface DownloadToken {
  o: string; // order id
  p: string; // product id
  f: FileFormat; // format
}

/** Create a signed, expiring download token for (order, product, format). */
export function createDownloadToken(orderId: string, productId: string, format: FileFormat): string {
  const payload = Buffer.from(JSON.stringify({ o: orderId, p: productId, f: format })).toString(
    "base64url"
  );
  return sign(payload, downloadTtlSeconds());
}

export function parseDownloadToken(token: string): DownloadToken | null {
  const raw = verify(token, downloadTtlSeconds());
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as DownloadToken;
    if (!obj.o || !obj.p || !obj.f) return null;
    return obj;
  } catch {
    return null;
  }
}

/** True when the order may unlock files for this product/format. */
export function canDownload(order: Order | undefined, productId: string, format: FileFormat): boolean {
  if (!order || order.status !== "paid") return false;
  const product = catalog.find(productId);
  if (!product) return false;
  if (!product.formats.includes(format)) return false;
  const item = order.items.find((i) => i.productId === productId);
  if (!item) return false;
  if (product.productType === "ebook" || product.productType === "prompt") {
    return item.format === format || true; // format switching allowed
  }
  return item.format === format;
}

/** Absolute path for a storage-relative path (e.g. storage/ebooks/x/book.pdf). */
export function storagePath(rel: string): string {
  return path.join(process.cwd(), rel);
}

export function fileExists(rel: string): boolean {
  try {
    return fs.existsSync(storagePath(rel));
  } catch {
    return false;
  }
}

/** Unlock all downloads for a paid order and notify the buyer. */
export async function fulfillOrder(orderId: string): Promise<void> {
  const order = orders.find(orderId);
  if (!order || order.status !== "paid") return;

  for (const item of order.items) {
    const product = catalog.find(item.productId);
    if (!product) continue;
    if (product.productType === "bundle") {
      downloads.upsert({
        id: randomId(16),
        orderId,
        productId: product.id,
        format: "zip",
        count: 0,
        lastDownloadedAt: null,
        createdAt: nowIso(),
      });
      continue;
    }
    // Unlock every format the product ships in — this is what makes
    // format switching on re-downloads possible.
    for (const fmt of product.formats) {
      downloads.upsert({
        id: randomId(16),
        orderId,
        productId: product.id,
        format: fmt,
        count: 0,
        lastDownloadedAt: null,
        createdAt: nowIso(),
      });
    }
  }

  await sendOrderEmail(order);
}

/** File name shown to the buyer when downloading. */
export function downloadFilename(product: Product, format: FileFormat): string {
  const ext = format === "docx" ? "docx" : format;
  return `${product.sku.toLowerCase()}.${ext}`;
}

export interface DownloadRowView {
  orderId: string;
  productId: string;
  productTitle: string;
  productType: Product["productType"];
  format: FileFormat;
  token: string;
  expiresInSeconds: number;
  fileName: string;
  sizeBytes: number | null;
  count: number;
  lastDownloadedAt: string | null;
}

/** Build the dashboard view for every downloadable file of a buyer. */
export function downloadViewsFor(
  rows: { orderId: string; productId: string; format: FileFormat }[]
): DownloadRowView[] {
  const out: DownloadRowView[] = [];
  for (const r of rows) {
    const product = catalog.find(r.productId);
    if (!product) continue;
    const rel = product.filePaths[r.format];
    if (!rel) continue;
    let sizeBytes: number | null = null;
    try {
      sizeBytes = fs.statSync(storagePath(rel)).size;
    } catch {
      sizeBytes = null;
    }
    out.push({
      orderId: r.orderId,
      productId: r.productId,
      productTitle: product.title,
      productType: product.productType,
      format: r.format,
      token: createDownloadToken(r.orderId, r.productId, r.format),
      expiresInSeconds: downloadTtlSeconds(),
      fileName: downloadFilename(product, r.format),
      sizeBytes,
      count: 0,
      lastDownloadedAt: null,
    });
  }
  return out;
}

/** Whether a refunded/revoked order can still stream. */
export function isRevoked(order: Order): boolean {
  return order.status === "refunded";
}
