"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FileFormat } from "@/lib/types";

export default function AddToCart({
  productId,
  formats,
  defaultFormat,
  priceLabel,
}: {
  productId: string;
  formats: FileFormat[];
  defaultFormat: FileFormat;
  priceLabel: string;
}) {
  const router = useRouter();
  const [format, setFormat] = useState<FileFormat>(defaultFormat);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, format }),
      });
      if (!res.ok) throw new Error("add failed");
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2500);
    } catch {
      alert("Could not add to cart. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {formats.length > 1 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted">
            Choose format
          </p>
          <div className="flex gap-2">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold uppercase transition ${
                  format === f
                    ? "bg-navy text-white"
                    : "border border-line bg-white text-ink hover:border-muted"
                }`}
              >
                {f === "docx" ? "Word" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={add} disabled={busy} className="btn-teal w-full">
        {added ? "✓ Added to cart" : busy ? "Adding…" : `Add to cart — ${priceLabel}`}
      </button>
    </div>
  );
}
