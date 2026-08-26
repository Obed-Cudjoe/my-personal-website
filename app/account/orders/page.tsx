import Link from "next/link";
import { getSession } from "@/lib/auth";
import { orders } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Purchase history" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-teal-soft text-teal-dark",
  pending: "bg-amber-soft text-amber",
  failed: "bg-red-soft text-red",
  refunded: "bg-soft text-muted",
};

export default async function OrdersPage() {
  const session = await getSession();
  const userOrders = session ? orders.listByUser(session.userId) : [];

  return (
    <div>
      <h2 className="section-title">Purchase history</h2>
      {userOrders.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-3xl">🧾</p>
          <p className="mt-2 font-bold text-navy">No orders yet</p>
          <Link href="/shop" className="btn-primary mt-4">
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {userOrders.map((o) => (
            <li key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-navy">
                    Order {o.id}
                    <span className="ml-2 text-xs font-semibold text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {o.items.map((i) => i.title).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-navy">{formatGhs(o.totalGhs)}</span>
                  <span className={`chip ${STATUS_STYLES[o.status] ?? "bg-soft text-muted"}`}>
                    {o.status}
                  </span>
                </div>
              </div>
              {o.status === "paid" && (
                <Link
                  href={`/checkout/success/${o.id}`}
                  className="mt-2 inline-block text-xs font-bold text-teal-dark hover:underline"
                >
                  View downloads →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
