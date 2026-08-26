import { NextRequest, NextResponse } from "next/server";
import { markPaid, verifyPaystackSignature } from "@/lib/payments";

/**
 * Paystack webhook — receives charge.success the instant a mobile-money
 * payment is confirmed, verifies the HMAC-SHA512 signature and unlocks
 * downloads. Retries are idempotent (markPaid checks the reference).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Webhook received but PAYSTACK_SECRET_KEY is not configured." },
      { status: 200 } // acknowledge so Paystack stops retrying
    );
  }
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: { reference: string; amount?: number; currency?: string };
  };

  if (event.event === "charge.success") {
    await markPaid(event.data.reference);
  }
  // Acknowledge fast — Paystack treats any non-2xx as failure and retries.
  return NextResponse.json({ ok: true });
}
