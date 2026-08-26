import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { orders } from "@/lib/store";

/** Status polling endpoint for the pay screen (step 2). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = orders.find(params.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      totalGhs: order.totalGhs,
    },
  });
}
