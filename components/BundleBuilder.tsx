"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatGhs } from "@/lib/format";

interface Choice {
  id: string;
  sku: string;
  title: string;
  priceGhs: number;
  productType: string;
}

export default function BundleBuilder({ products }: { products: Choice[] }) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("marketing");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const picked = products.filter((p) => selected.has(p.id));
  const value = picked.reduce((s, p) => s + p.priceGhs, 0);
  const savings = value - (parseFloat(price) || 0);
  const pct = value > 0 ? Math.round((savings / value) * 100) : 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          title,
          description,
          category,
          priceGhs: parseFloat(price),
          items: [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOk(`Bundle ${data.bundle.sku} created — value ${formatGhs(value)} → ${formatGhs(data.bundle.priceGhs)} (save ${data.pct}%). ZIP is being built.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder="BND-XXX-01" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <option value="marketing">Marketing</option>
            <option value="freelance">Freelance</option>
            <option value="creators">Creators</option>
            <option value="smb">Small Business</option>
            <option value="dev">Dev / Analysts</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Bundle title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete Marketing AI Toolkit" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input" required />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">1 · Pick products</p>
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-line p-2">
          {products.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-soft">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 accent-teal" />
              <span className="min-w-0 flex-1 truncate text-ink">{p.title}</span>
              <span className="text-xs font-semibold text-muted">
                {formatGhs(p.priceGhs)} · {p.productType}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">2 · Pricing</p>
        <div className="rounded-xl bg-soft p-3 text-sm">
          <p className="text-muted">Combined value: <b className="text-navy">{formatGhs(value)}</b></p>
          <label className="mt-2 block text-xs font-semibold text-muted">Bundle price (GH₵)</label>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="319" className="input mt-1" required />
          {value > 0 && price && (
            <p className={`mt-2 text-xs font-bold ${pct > 0 ? "text-teal-dark" : "text-red"}`}>
              {pct > 0 ? `Buyer saves ${formatGhs(savings)} (${pct}%)` : "Bundle price must be below combined value to show savings."}
            </p>
          )}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-soft p-3 text-xs font-semibold text-red">{error}</p>}
      {ok && <p className="rounded-lg bg-teal-soft p-3 text-xs font-semibold text-teal-dark">{ok}</p>}

      <button disabled={busy || picked.length < 2} className="btn-primary w-full">
        {busy ? "Creating…" : "Create bundle & build ZIP"}
      </button>
    </form>
  );
}
