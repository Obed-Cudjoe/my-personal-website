import { NextRequest, NextResponse } from "next/server";
import { markFailed, markPaid } from "@/lib/payments";
import { orders, payments } from "@/lib/store";

/**
 * Demo gateway — simulates the buyer approving (or declining) the
 * MoMo / Telecel Cash prompt on their phone. In production the same
 * code path runs from the Paystack webhook (app/api/webhooks/paystack).
 */
export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const orderId = req.nextUrl.searchParams.get("order");
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });
  const order = orders.find(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const payment = payments.findByOrder(orderId);
  if (!payment || payment.provider !== "demo") {
    return NextResponse.json({ error: "Not a demo payment." }, { status: 400 });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ status: order.status });
  }

  if (params.action === "approve") {
    await markPaid(payment.reference);
    return NextResponse.json({ status: "paid", orderId });
  }
  if (params.action === "decline") {
    await markFailed(payment.reference);
    return NextResponse.json({ status: "failed", orderId });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
