import Link from "next/link";
import { orders } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Admin — Orders" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-teal-soft text-teal-dark",
  pending: "bg-amber-soft text-amber",
  failed: "bg-red-soft text-red",
  refunded: "bg-soft text-muted",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  let list = orders.list();
  if (q) {
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q)
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title !mb-0">Orders</h2>
        <form method="get" className="flex flex-1 justify-end gap-2 sm:max-w-xs">
          <input name="q" defaultValue={q} placeholder="Search email / phone / order #" className="input py-2 text-xs" />
          <button className="btn-ghost !px-3 !py-2 text-xs">Go</button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-bold text-navy">No orders yet</p>
          <p className="mt-1 text-sm text-muted">
            Orders appear here the moment a buyer checks out. Try a demo purchase.
          </p>
          <Link href="/shop" className="btn-ghost mt-4 text-xs">Open the shop</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-navy">
                    {o.id} · {o.email}
                    <span className="ml-2 font-mono text-xs text-muted">{o.phone}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {o.items.map((i) => `${i.title} (${i.format.toUpperCase()})`).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-navy">{formatGhs(o.totalGhs)}</span>
                  <span className={`chip ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {o.paymentMethod === "mtn_momo" ? "MTN MoMo" : "Telecel Cash"} ·{" "}
                {new Date(o.createdAt).toLocaleString("en-GB")}
                {o.status === "paid" && (
                  <>
                    {" · "}
                    <Link href={`/checkout/success/${o.id}`} className="font-bold text-teal-dark hover:underline">
                      View downloads
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
