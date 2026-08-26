import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Admin — Bundles" };

export default async function AdminBundlesPage() {
  const bundles = catalog.bundles();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title !mb-0">Bundles</h2>
        <Link href="/admin/bundles/new" className="btn-primary !px-3 !py-2 text-xs">
          + Build bundle
        </Link>
      </div>
      <ul className="space-y-3">
        {bundles.map((b) => {
          const value = catalog.bundleValue(b);
          const pct = value > 0 ? Math.round(((value - b.priceGhs) / value) * 100) : 0;
          return (
            <li key={b.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-navy">{b.title}</p>
                  <p className="text-xs text-muted">
                    {b.items?.length ?? 0} items · value {formatGhs(value)} →{" "}
                    <b className="text-teal-dark">{formatGhs(b.priceGhs)}</b> (save {pct}%)
                  </p>
                </div>
                <span className={`chip ${b.filePaths.zip ? "bg-teal-soft text-teal-dark" : "bg-amber-soft text-amber"}`}>
                  {b.filePaths.zip ? "ZIP built" : "ZIP not built"}
                </span>
              </div>
              {!b.filePaths.zip && (
                <form action={`/api/admin/bundles/${b.id}/build-zip`} method="post">
                  <button className="btn-teal mt-3 !px-3 !py-2 text-xs">Build ZIP now</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
