"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatGhs } from "@/lib/format";

export default function PayScreen({
  orderId,
  amount,
  method,
  maskedPhone,
  paymentProvider,
}: {
  orderId: string;
  amount: number;
  method: string;
  maskedPhone: string;
  paymentProvider: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "checking" | "error">("waiting");
  const [message, setMessage] = useState("");

  // Poll the order status until it resolves.
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.order?.status === "paid") {
          clearInterval(timer);
          router.push(`/checkout/success/${orderId}`);
        } else if (data.order?.status === "failed") {
          clearInterval(timer);
          router.push(`/checkout/failed/${orderId}`);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  async function act(action: "approve" | "decline") {
    setState("checking");
    setMessage("");
    try {
      const res = await fetch(`/api/payments/demo/${action}?order=${orderId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (data.status === "paid") router.push(`/checkout/success/${orderId}`);
      else if (data.status === "failed") router.push(`/checkout/failed/${orderId}`);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setState("waiting");
    }
  }

  const isDemo = paymentProvider === "demo";

  return (
    <div className="card space-y-4">
      <div className="rounded-xl bg-soft p-4 text-center">
        <p className="text-xs font-semibold text-muted">You&apos;re paying</p>
        <p className="text-3xl font-black text-navy">{formatGhs(amount)}</p>
        <p className="mt-1 text-xs text-muted">
          to <b className="text-navy">Cudjoe Digital Studio</b> via {method}
        </p>
      </div>

      {isDemo ? (
        <>
          <div className="rounded-xl border border-dashed border-teal bg-teal-soft p-4 text-center">
            <p className="text-sm font-bold text-navy">
              Demo payment — simulate the phone prompt
            </p>
            <p className="mt-1 text-xs text-muted">
              In production this screen shows the real MTN MoMo / Telecel Cash flow:
              a USSD or app push to <b>{maskedPhone}</b>, approve with your PIN, and
              the webhook confirms instantly.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => act("approve")} disabled={state === "checking"} className="btn-teal">
              {state === "checking" ? "Checking…" : "✓ Approve payment"}
            </button>
            <button onClick={() => act("decline")} disabled={state === "checking"} className="btn-ghost">
              Cancel
            </button>
          </div>
          <p className="text-center text-[11px] text-muted">
            Simulates approving the {method} prompt on your phone
          </p>
        </>
      ) : (
        <div className="rounded-xl bg-soft p-4 text-center">
          <p className="text-sm font-bold text-navy">Payment prompt sent to your phone</p>
          <p className="mt-1 text-xs text-muted">
            Approve the {method} prompt on <b>{maskedPhone}</b> with your PIN.
            This page updates automatically when payment is confirmed.
          </p>
        </div>
      )}

      {message && <p className="rounded-lg bg-red-soft p-3 text-xs font-semibold text-red">{message}</p>}
    </div>
  );
}
