"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FileFormat } from "@/lib/types";
import type { CartLine } from "@/lib/cart";
import { formatGhs } from "@/lib/format";

export default function CartView({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function changeFormat(productId: string, format: FileFormat) {
    setBusy(productId);
    try {
      await fetch(`/api/cart/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(productId: string) {
    setBusy(productId);
    try {
      await fetch(`/api/cart/${productId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="space-y-3">
      {lines.map((line) => (
        <li key={line.productId} className="card flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft text-xl">
            {line.product.productType === "ebook" ? "📖" : line.product.productType === "bundle" ? "🎁" : "📦"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-navy">{line.title}</p>
            <p className="text-xs text-muted">
              {line.product.productType === "ebook"
                ? "Ebook"
                : line.product.productType === "bundle"
                  ? "Bundle — all files in one ZIP"
                  : "Prompt pack"}{" "}
              · {formatGhs(line.unitPrice)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={line.format}
                disabled={busy === line.productId}
                onChange={(e) => changeFormat(line.productId, e.target.value as FileFormat)}
                className="input w-auto py-1.5 text-xs"
                aria-label={`Format for ${line.title}`}
              >
                {line.product.formats.map((f) => (
                  <option key={f} value={f}>
                    {f === "docx" ? "Word (.docx)" : `${f.toUpperCase()} file`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => remove(line.productId)}
                disabled={busy === line.productId}
                className="text-xs font-bold text-red hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
          <p className="text-sm font-extrabold text-navy">{formatGhs(line.total)}</p>
        </li>
      ))}
    </ul>
  );
}
