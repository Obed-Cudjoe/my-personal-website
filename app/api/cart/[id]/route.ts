import { NextRequest, NextResponse } from "next/server";
import { removeFromCart, updateCartItem } from "@/lib/cart";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { format } = (await req.json()) as { format?: string };
    if (!format) return NextResponse.json({ error: "format required." }, { status: 400 });
    const items = await updateCartItem(params.id, format as never);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const items = await removeFromCart(params.id);
  return NextResponse.json({ items });
}
