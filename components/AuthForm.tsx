"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.push(data.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "signup" && (
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="input"
      />
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 6 characters)"
        className="input"
      />
      {error && <p className="rounded-lg bg-red-soft p-3 text-xs font-semibold text-red">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      {mode === "login" && (
        <p className="text-center text-[11px] text-muted">
          Demo tip: any account works — or use the seeded admin (admin@cudjoe.digital / admin123).
        </p>
      )}
    </form>
  );
}
