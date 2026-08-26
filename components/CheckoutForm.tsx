"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FileFormat } from "@/lib/types";
import type { CartLine } from "@/lib/cart";
import { PAYMENT_METHODS } from "@/lib/types";
import { formatGhs } from "@/lib/format";

export default function CheckoutForm({
  lines,
  total,
  defaultEmail,
}: {
  lines: CartLine[];
  total: number;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"mtn_momo" | "telecel_cash">("mtn_momo");
  const [formats, setFormats] = useState<Record<string, FileFormat>>(() =>
    Object.fromEntries(lines.map((l) => [l.productId, l.format]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, paymentMethod: method, formats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      // data: { orderId, demo?|paystack? }
      if (data.paystack?.authorizationUrl) {
        window.location.href = data.paystack.authorizationUrl;
        return;
      }
      router.push(`/checkout/pay?order=${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      {/* Contact */}
      <div>
        <p className="section-title !mb-2">1 · Contact</p>
        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address (for your receipt + download links)"
            className="input"
          />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={`Phone number (${method === "mtn_momo" ? "024/054/055/059" : "020/026/027/050"})`}
            className="input"
          />
        </div>
      </div>

      {/* Formats */}
      <div>
        <p className="section-title !mb-2">2 · Confirm formats</p>
        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm">
              <span className="min-w-0 flex-1 line-clamp-1 font-semibold text-ink">{l.title}</span>
              {l.product.formats.length > 1 ? (
                <select
                  value={formats[l.productId]}
                  onChange={(e) =>
                    setFormats((f) => ({ ...f, [l.productId]: e.target.value as FileFormat }))
                  }
                  className="input w-auto py-1.5 text-xs"
                >
                  {l.product.formats.map((f) => (
                    <option key={f} value={f}>{f === "docx" ? "Word" : f.toUpperCase()}</option>
                  ))}
                </select>
              ) : (
                <span className="chip bg-soft text-muted">
                  {l.product.formats[0] === "docx" ? "Word" : l.product.formats[0].toUpperCase()}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          Ebooks: the other format stays available in your account forever. Bundles: one ZIP.
        </p>
      </div>

      {/* Payment method */}
      <div>
        <p className="section-title !mb-2">3 · Payment method</p>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                method === m.id ? "border-navy bg-navy-soft/10" : "border-line hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="h-4 w-4 accent-teal"
              />
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy">{m.label}</span>
                <span className="block text-xs text-muted">Phone: {m.hint}</span>
              </span>
              <span className="text-lg">{m.id === "mtn_momo" ? "💛" : "🟦"}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-soft p-3 text-xs font-semibold text-red">{error}</p>}

      <button disabled={busy} className="btn-teal w-full">
        {busy ? "Creating order…" : `Continue — pay ${formatGhs(total)}`}
      </button>
      <p className="text-center text-[11px] text-muted">
        You&apos;ll approve the payment with your MoMo PIN on your phone. Nothing is
        charged until you approve.
      </p>
    </form>
  );
}
