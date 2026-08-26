import { NextRequest, NextResponse } from "next/server";
import { addToCart, getCart } from "@/lib/cart";

export async function GET() {
  return NextResponse.json({ items: await getCart() });
}

export async function POST(req: NextRequest) {
  try {
    const { productId, format } = (await req.json()) as {
      productId?: string;
      format?: string;
    };
    if (!productId || !format) {
      return NextResponse.json({ error: "productId and format are required." }, { status: 400 });
    }
    const items = await addToCart(productId, format as never);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add item." },
      { status: 400 }
    );
  }
}
