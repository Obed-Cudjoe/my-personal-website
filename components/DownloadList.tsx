"use client";
import { useState } from "react";
import type { DownloadRowView } from "@/lib/delivery";

function fmtBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DownloadList({ views }: { views: DownloadRowView[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Record<string, string>>({});

  async function refreshLink(view: DownloadRowView) {
    setRefreshing(view.productId + view.format);
    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: view.orderId, productId: view.productId, format: view.format }),
      });
      const data = await res.json();
      if (data.token) setFresh((f) => ({ ...f, [`${view.productId}:${view.format}`]: data.token }));
    } finally {
      setRefreshing(null);
    }
  }

  async function copy(view: DownloadRowView) {
    const token = fresh[`${view.productId}:${view.format}`] ?? view.token;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/api/downloads/${token}`
      );
      setCopied(`${view.productId}:${view.format}`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <ul className="space-y-2">
      {views.map((v) => {
        const key = `${v.productId}:${v.format}`;
        const token = fresh[key] ?? v.token;
        return (
          <li key={key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy">{v.productTitle}</p>
              <p className="text-xs text-muted">
                {v.productType === "ebook"
                  ? "Ebook"
                  : v.productType === "bundle"
                    ? "Bundle ZIP"
                    : "Prompt pack"}{" "}
                · {v.format === "docx" ? "Word" : v.format.toUpperCase()} ·{" "}
                {fmtBytes(v.sizeBytes) || "—"} · expires in {Math.round(v.expiresInSeconds / 3600)} h
              </p>
            </div>
            <div className="flex gap-2">
              <a href={`/api/downloads/${token}`} className="btn-teal !px-3 !py-2 text-xs">
                ↓ Download
              </a>
              <button
                onClick={() => copy(v)}
                className="btn-ghost !px-3 !py-2 text-xs"
              >
                {copied === key ? "✓ Copied" : "Copy link"}
              </button>
              <button
                onClick={() => refreshLink(v)}
                disabled={refreshing === key}
                className="btn-ghost !px-3 !py-2 text-xs"
              >
                {refreshing === key ? "…" : "New link"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
