import crypto from "crypto";
import { catalog } from "./catalog";
import { orders, payments } from "./store";
import { fulfillOrder } from "./delivery";
import { nowIso, orderNumber, randomId, formatGhs } from "./util";
import type { Order, OrderItem, Payment } from "./types";
import type { CartLine } from "./cart";

/**
 * Payment layer.
 * - DEMO gateway: used when PAYSTACK_SECRET_KEY is not set. Simulates the
 *   MTN MoMo / Telecel Cash prompt + webhook so the whole flow is testable.
 * - PAYSTACK: real Ghana mobile-money integration (MTN MoMo, Telecel Cash).
 *   The webhook route verifies the HMAC signature and calls the same
 *   fulfillOrder() path as the demo gateway.
 */

export interface CheckoutInput {
  email: string;
  phone: string;
  paymentMethod: "mtn_momo" | "telecel_cash";
  userId: string | null;
  items: CartLine[];
  totalGhs: number;
}

export interface CheckoutResult {
  order: Order;
  payment: Payment;
  paystack?: { authorizationUrl: string; accessCode: string };
  demo?: { approvePath: string; declinePath: string };
}

export function validateGhanaPhone(phone: string, method: "mtn_momo" | "telecel_cash"): boolean {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!/^(0|\+?233)[0-9]{9}$/.test(digits.length === 12 ? digits.slice(2) : digits)) return false;
  const local = digits.startsWith("233") ? `0${digits.slice(3)}` : digits;
  const mtn = /^0(24|54|55|59)/.test(local);
  const telecel = /^0(20|26|27|50)/.test(local);
  return method === "mtn_momo" ? mtn : telecel;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const orderId = orderNumber();
  const items: OrderItem[] = input.items.map((l) => ({
    productId: l.productId,
    title: l.title,
    productType: l.product.productType,
    format: l.format,
    priceGhs: l.unitPrice,
  }));

  const order: Order = {
    id: orderId,
    userId: input.userId,
    email: input.email.toLowerCase(),
    phone: input.phone,
    status: "pending",
    items,
    totalGhs: input.totalGhs,
    paymentMethod: input.paymentMethod,
    createdAt: nowIso(),
  };
  orders.create(order);

  const reference = randomId(20);
  const payment: Payment = {
    id: randomId(16),
    orderId,
    provider: "demo",
    channel: input.paymentMethod,
    reference,
    status: "pending",
    amountGhs: input.totalGhs,
    createdAt: nowIso(),
  };

  // Real gateway path (Paystack, Ghana): initialize a mobile-money charge.
  if (process.env.PAYSTACK_SECRET_KEY) {
    payment.provider = "paystack";
    payments.create(payment);
    const init = await paystackInitialize(input, orderId, reference);
    return { order, payment, paystack: init };
  }

  // Demo gateway path: buyer approves on the pay screen.
  payments.create(payment);
  return {
    order,
    payment,
    demo: {
      approvePath: `/api/payments/demo/approve?order=${orderId}`,
      declinePath: `/api/payments/demo/decline?order=${orderId}`,
    },
  };
}

async function paystackInitialize(
  input: CheckoutInput,
  orderId: string,
  reference: string
) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(input.totalGhs * 100),
      currency: "GHS",
      email: input.email,
      reference,
      channels: ["mobile_money"],
      metadata: {
        order_id: orderId,
        phone: input.phone,
        payment_method: input.paymentMethod,
        custom_fields: [
          { display_name: "Order", variable_name: "order_id", value: orderId },
        ],
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PAYSTACK_INIT_FAILED: ${res.status} ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  if (!data.status) throw new Error(`PAYSTACK_INIT_REJECTED: ${data.message ?? "unknown"}`);
  return {
    authorizationUrl: data.data.authorization_url as string,
    accessCode: data.data.access_code as string,
  };
}

/** Verify a Paystack charge via the transaction endpoint (reconciliation). */
export async function paystackVerify(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PAYSTACK_VERIFY_FAILED: ${res.status}`);
  return (await res.json()) as {
    status: boolean;
    data: {
      status: string;
      amount: number;
      currency: string;
      reference: string;
    };
  };
}

/** Verify the Paystack webhook signature (HMAC-SHA512 of the raw body). */
export function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Shared: mark a payment + order as paid and unlock downloads (idempotent). */
export async function markPaid(paymentRef: string): Promise<Order | null> {
  const payment = payments.findByReference(paymentRef);
  if (!payment) return null;
  if (payment.status === "paid") return orders.find(payment.orderId) ?? null; // idempotent
  const order = orders.find(payment.orderId);
  if (!order) return null;

  payments.update(payment.id, { status: "paid" });
  orders.update(order.id, { status: "paid" });
  await fulfillOrder(order.id);
  return orders.find(order.id) ?? null;
}

export async function markFailed(paymentRef: string): Promise<void> {
  const payment = payments.findByReference(paymentRef);
  if (!payment || payment.status !== "pending") return;
  payments.update(payment.id, { status: "failed" });
  orders.update(payment.orderId, { status: "failed" });
}

export function paymentSummary(order: Order): string {
  const method =
    order.paymentMethod === "mtn_momo" ? "MTN Mobile Money" : "Telecel Cash";
  return `${formatGhs(order.totalGhs)} via ${method}`;
}

/** Bundles a set of products into a value + savings summary. */
export function bundleSavings(bundleId: string) {
  const bundle = catalog.find(bundleId);
  if (!bundle || bundle.productType !== "bundle") return null;
  const value = catalog.bundleValue(bundle);
  const savings = value - bundle.priceGhs;
  const pct = value > 0 ? Math.round((savings / value) * 100) : 0;
  return { value, savings, pct };
}
