import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/delivery";
import { downloads, orders } from "@/lib/store";

/** List a buyer's download tokens (used to refresh links from the dashboard). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rows = downloads.listByUser(session.userId);
  return NextResponse.json({ downloads: rows });
}

/** Generate a fresh signed token for (order, product, format). */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = (await req.json()) as {
      orderId?: string;
      productId?: string;
      format?: string;
    };
    const order = body.orderId ? orders.find(body.orderId) : undefined;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Access check: logged-in owner, or guest who bought with the same email.
    const isOwner = session
      ? order.userId === session.userId
      : true; // guest tokens are validated against the order email at download time
    if (!isOwner) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    if (!order.items.some((i) => i.productId === body.productId)) {
      return NextResponse.json({ error: "Not part of this order." }, { status: 403 });
    }
    if (order.status !== "paid") {
      return NextResponse.json({ error: "Order is not paid." }, { status: 403 });
    }
    const token = createDownloadToken(
      order.id,
      body.productId!,
      body.format as "pdf" | "docx" | "epub" | "zip"
    );
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
  }
}
