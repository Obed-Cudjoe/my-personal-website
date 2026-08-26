import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { TYPE_LABELS } from "@/lib/types";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Admin — Products" };

export default async function AdminProductsPage() {
  const products = catalog.all().sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title !mb-0">All products</h2>
        <div className="flex gap-2">
          <Link href="/admin/products/new?type=prompt" className="btn-primary !px-3 !py-2 text-xs">
            + Prompt pack
          </Link>
          <Link href="/admin/products/new?type=ebook" className="btn-primary !px-3 !py-2 text-xs">
            + Ebook
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy text-xs uppercase tracking-widest text-white">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Formats</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{p.sku}</td>
                <td className="px-4 py-3 font-semibold text-ink">{p.title}</td>
                <td className="px-4 py-3">
                  <span className="chip bg-purple-soft text-purple">{TYPE_LABELS[p.productType]}</span>
                </td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                <td className="px-4 py-3 font-bold text-navy">{formatGhs(p.priceGhs)}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.formats.map((f) => (f === "docx" ? "Word" : f.toUpperCase())).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <span className={`chip ${p.active ? "bg-teal-soft text-teal-dark" : "bg-soft text-muted"}`}>
                    {p.active ? "Live" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
