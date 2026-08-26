import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { orders } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Admin — Overview" };

export default async function AdminPage() {
  const all = orders.list();
  const paid = all.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.totalGhs, 0);

  // Revenue by product type (from paid order items).
  const byType: Record<string, number> = { prompt: 0, ebook: 0, bundle: 0 };
  for (const o of paid) {
    for (const it of o.items) {
      byType[it.productType] = (byType[it.productType] ?? 0) + it.priceGhs;
    }
  }

  // Revenue last 14 days.
  const dayMap = new Map<string, number>();
  for (const o of paid) {
    const day = o.createdAt.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + o.totalGhs);
  }
  const days = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14);

  // Top products.
  const prodMap = new Map<string, number>();
  for (const o of paid) {
    for (const it of o.items) {
      prodMap.set(it.title, (prodMap.get(it.title) ?? 0) + it.priceGhs);
    }
  }
  const top = [...prodMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const maxDay = Math.max(1, ...days.map(([, v]) => v));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [formatGhs(revenue), "Total revenue"],
          [`${paid.length}`, "Paid orders"],
          [`${all.length}`, "All orders"],
          [`${catalog.all().length}`, "Products live"],
        ].map(([v, l]) => (
          <div key={l} className="card">
            <p className="text-xl font-black text-navy">{v}</p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by type */}
        <div className="card">
          <h2 className="section-title !mb-3">Revenue by product type</h2>
          {(["prompt", "ebook", "bundle"] as const).map((t) => {
            const v = byType[t] ?? 0;
            const pct = revenue > 0 ? Math.round((v / revenue) * 100) : 0;
            return (
              <div key={t} className="mb-3">
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span className="capitalize text-ink">{t} packs</span>
                  <span className="text-muted">{formatGhs(v)} · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-soft">
                  <div className="h-2 rounded-full bg-navy" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue last 14 days */}
        <div className="card">
          <h2 className="section-title !mb-3">Revenue — last 14 days</h2>
          <div className="flex h-28 items-end gap-1">
            {days.length === 0 && (
              <p className="text-sm text-muted">No paid orders yet.</p>
            )}
            {days.map(([day, v]) => (
              <div key={day} className="group relative flex-1">
                <div
                  className="w-full rounded-t bg-teal"
                  style={{ height: `${Math.max(6, (v / maxDay) * 100)}%` }}
                  title={`${day}: ${formatGhs(v)}`}
                />
                <p className="mt-1 hidden text-[8px] text-muted group-hover:block">
                  {day.slice(5)} · {formatGhs(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="card">
        <h2 className="section-title !mb-3">Top products by revenue</h2>
        {top.length === 0 ? (
          <p className="text-sm text-muted">No sales yet — run a test purchase to see data.</p>
        ) : (
          <ol className="space-y-2">
            {top.map(([title, v], i) => (
              <li key={title} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-soft text-xs font-black text-navy">
                    {i + 1}
                  </span>
                  {title}
                </span>
                <span className="font-bold text-navy">{formatGhs(v)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Link href="/admin/products/new?type=prompt" className="btn-primary">
        + Add a product
      </Link>
    </div>
  );
}
