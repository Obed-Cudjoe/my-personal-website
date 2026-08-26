import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import { cartLines, cartTotal } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const lines = await cartLines();
  const total = await cartTotal();
  const session = await getSession();

  if (lines.length === 0) {
    return (
      <div className="card mx-auto max-w-md py-16 text-center">
        <p className="text-3xl">🛒</p>
        <p className="mt-2 font-bold text-navy">Your cart is empty</p>
        <Link href="/shop" className="btn-primary mt-4">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy">Checkout</h1>
        <span className="chip bg-soft text-muted">Step 1 of 2</span>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <CheckoutForm
          lines={lines}
          total={total}
          defaultEmail={session?.email ?? ""}
        />
        <aside className="space-y-3">
          <div className="card">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
              Order summary
            </p>
            {lines.map((l) => (
              <div key={l.productId} className="flex justify-between gap-2 py-1.5 text-sm">
                <span className="line-clamp-1 text-ink">{l.title}</span>
                <span className="shrink-0 font-semibold">{formatGhs(l.total)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-black text-navy">
              <span>Total</span>
              <span>{formatGhs(total)}</span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Instant delivery · 14-day refund · Secure mobile-money checkout
            </p>
          </div>
          <Link href="/cart" className="block text-center text-xs font-bold text-muted hover:text-navy">
            ← Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
