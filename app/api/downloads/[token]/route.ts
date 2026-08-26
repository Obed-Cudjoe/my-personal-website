import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { catalog, FREE_ITEMS } from "@/lib/catalog";
import {
  MIME,
  canDownload,
  downloadFilename,
  fileExists,
  isRevoked,
  parseDownloadToken,
  storagePath,
} from "@/lib/delivery";
import { downloads, orders } from "@/lib/store";

/**
 * Signed download route.
 * Validates the HMAC token (expiry included), confirms the order is paid and
 * owns the product, then streams the file with the right MIME type and
 * Range-request support (so interrupted downloads can resume).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = parseDownloadToken(params.token);
  if (!token) {
    return new NextResponse(
      `Download link invalid or expired. Get a fresh link from your account: ${origin(req)}/account/downloads`,
      { status: 410, headers: { "Content-Type": "text/plain" } }
    );
  }

  // Free lead-magnet items are keyed by the special FREE order id.
  if (token.o === "FREE") {
    const free = FREE_ITEMS.find((f) => f.id === token.p);
    const rel = free?.filePaths[token.f as keyof typeof free.filePaths];
    if (!free || !rel || !fileExists(rel)) {
      return new NextResponse("File not found.", { status: 404 });
    }
    const data = fs.readFileSync(storagePath(rel));
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[token.f] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${free.id}.${token.f === "docx" ? "docx" : token.f}"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  }

  const order = orders.find(token.o);
  if (!order) return new NextResponse("Order not found.", { status: 404 });
  if (isRevoked(order)) return new NextResponse("Download access revoked.", { status: 403 });
  if (!canDownload(order, token.p, token.f)) {
    return new NextResponse("This order is not paid.", { status: 403 });
  }

  const product = catalog.find(token.p);
  if (!product) return new NextResponse("Product not found.", { status: 404 });
  const rel = product.filePaths[token.f];
  if (!rel || !fileExists(rel)) {
    return new NextResponse("File not found.", { status: 404 });
  }

  // Track the download.
  const row = downloads.listByOrder(order.id).find(
    (d) => d.productId === token.p && d.format === token.f
  );
  if (row) downloads.bump(row.id);

  const abs = storagePath(rel);
  const stat = fs.statSync(abs);
  const mime = MIME[token.f] ?? "application/octet-stream";
  const filename = downloadFilename(product, token.f);
  const range = req.headers.get("range");

  // Files at launch are 50 KB – 60 MB. Buffer responses are simpler and
  // robust on serverless; Range slicing keeps interrupted downloads
  // resumable. (For multi-GB assets later, switch to streamed responses.)
  const data = fs.readFileSync(abs);

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
      const slice = data.subarray(start, Math.min(end + 1, stat.size));
      return new NextResponse(slice, {
        status: 206,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(slice.length),
          "Content-Range": `bytes ${start}-${start + slice.length - 1}/${stat.size}`,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=0",
    },
  });
}

function origin(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
}
