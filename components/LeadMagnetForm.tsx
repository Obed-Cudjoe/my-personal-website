"use client";
import { useState } from "react";

export default function LeadMagnetForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { href: string }>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-teal/40 bg-teal-soft p-5 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-1 font-bold text-navy">Your free download is ready</p>
        <p className="mt-1 text-xs text-muted">
          Link expires in 48 hours — keep it safe.
        </p>
        <a href={done.href} className="btn-teal mt-4 w-full">
          ↓ Download now
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="input"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="input"
      />
      {error && <p className="text-xs font-semibold text-red">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Sending…" : "Send my free download"}
      </button>
    </form>
  );
}
