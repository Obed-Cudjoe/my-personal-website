import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { fileExists, MIME, storagePath } from "@/lib/delivery";

/**
 * Public file serving — ONLY for covers and samples (never product files).
 * Product files go through /api/downloads/[token] with a paid-order check.
 */
const ALLOWED_PREFIXES = ["storage/covers/", "storage/samples/"];

export function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path") ?? "";
  if (!rel || !ALLOWED_PREFIXES.some((p) => rel.startsWith(p))) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fileExists(rel)) return new NextResponse("Not found", { status: 404 });
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const data = fs.readFileSync(storagePath(rel));
  return new NextResponse(data, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
