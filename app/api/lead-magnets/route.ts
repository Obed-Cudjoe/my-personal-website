import { NextRequest, NextResponse } from "next/server";
import { FREE_ITEMS } from "@/lib/catalog";
import { createDownloadToken } from "@/lib/delivery";
import { subscribers } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, phone, slug } = (await req.json()) as {
      email?: string;
      phone?: string;
      slug?: string;
    };
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const item = FREE_ITEMS.find((f) => f.id === slug);
    if (!item) {
      return NextResponse.json({ error: "Unknown free item." }, { status: 404 });
    }
    if (!subscribers.exists(email)) {
      subscribers.create(email.toLowerCase(), phone ?? "", `lead-magnet:${slug}`);
    }
    // Free items are unlocked without an order — the token still carries the
    // HMAC + expiry, so links stay secure and expire after 48 hours.
    const token = createDownloadToken("FREE", item.id, item.filePaths.pdf ? "pdf" : "docx");
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.json({ href: `${base}/api/downloads/${token}` });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
  }
}
