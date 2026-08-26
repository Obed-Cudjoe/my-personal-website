import Link from "next/link";
import { notFound } from "next/navigation";
import { orders } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Payment failed" };

export default async function FailedPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = orders.find(params.orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-md">
      <div className="card border-red/30 bg-red-soft text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-2 text-xl font-black text-navy">Payment wasn&apos;t completed</h1>
        <p className="mt-2 text-sm text-muted">
          Order {order.id} ({formatGhs(order.totalGhs)}) is still <b>unpaid</b> — no
          money has left your account and nothing was delivered.
        </p>
        <p className="mt-2 text-xs text-muted">
          Common causes: you cancelled the prompt, the balance was insufficient, or
          the network timed out. Your cart is untouched.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        <Link href="/checkout" className="btn-teal w-full">
          Try checkout again
        </Link>
        <Link href="/cart" className="btn-ghost w-full">
          Back to cart
        </Link>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">
        Still stuck? WhatsApp us — we&apos;ll sort it out within minutes.
      </p>
    </div>
  );
}
