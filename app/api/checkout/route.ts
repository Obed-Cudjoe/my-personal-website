import { NextRequest, NextResponse } from "next/server";
import { cartLines, clearCart } from "@/lib/cart";
import { createCheckout, validateGhanaPhone } from "@/lib/payments";
import { getSession, setGuest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      phone?: string;
      paymentMethod?: "mtn_momo" | "telecel_cash";
    };
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const method = body.paymentMethod;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!method || !["mtn_momo", "telecel_cash"].includes(method)) {
      return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
    }
    if (!validateGhanaPhone(phone, method)) {
      return NextResponse.json(
        {
          error:
            method === "mtn_momo"
              ? "Enter a valid MTN MoMo number (024 / 054 / 055 / 059)."
              : "Enter a valid Telecel Cash number (020 / 026 / 027 / 050).",
        },
        { status: 400 }
      );
    }

    const lines = await cartLines();
    if (lines.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    const total = lines.reduce((s, l) => s + l.total, 0);

    const session = await getSession();
    const result = await createCheckout({
      email,
      phone,
      paymentMethod: method,
      userId: session?.userId ?? null,
      items: lines,
      totalGhs: total,
    });

    await setGuest(email);
    await clearCart();

    return NextResponse.json({
      orderId: result.order.id,
      demo: result.demo ?? undefined,
      paystack: result.paystack ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    const status = message.startsWith("PAYSTACK") ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
