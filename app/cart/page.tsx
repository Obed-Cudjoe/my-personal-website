import Link from "next/link";
import CartView from "@/components/CartView";
import { cartLines, cartTotal } from "@/lib/cart";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const lines = await cartLines();
  const total = await cartTotal();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 text-2xl font-extrabold text-navy">Your cart</h1>
      {lines.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl">🛒</p>
          <p className="mt-2 font-bold text-navy">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted">
            Prompt packs, ebooks and bundles are waiting in the shop.
          </p>
          <Link href="/shop" className="btn-primary mt-5">
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <CartView lines={lines} />
          <div className="card mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Delivery: instant · free</p>
              <p className="text-lg font-black text-navy">
                Subtotal: {formatGhs(total)}
              </p>
            </div>
            <Link href="/checkout" className="btn-teal w-full sm:w-auto">
              Checkout — {formatGhs(total)}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
