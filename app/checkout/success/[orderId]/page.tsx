import Link from "next/link";
import { notFound } from "next/navigation";
import DownloadList from "@/components/DownloadList";
import { orders, downloads } from "@/lib/store";
import { downloadViewsFor } from "@/lib/delivery";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Payment confirmed" };

export default async function SuccessPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = orders.find(params.orderId);
  if (!order) notFound();
  if (order.status !== "paid") {
    return (
      <div className="card mx-auto max-w-md py-16 text-center">
        <p className="text-3xl">⏳</p>
        <p className="mt-2 font-bold text-navy">Payment still pending</p>
        <p className="mt-1 text-sm text-muted">
          We&apos;re waiting for confirmation. This page refreshes automatically.
        </p>
        <meta httpEquiv="refresh" content="4" />
      </div>
    );
  }

  const rows = downloads.listByOrder(order.id);
  const views = downloadViewsFor(rows);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card border-teal/40 bg-teal-soft text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-2 text-2xl font-black text-navy">Payment confirmed — thank you!</h1>
        <p className="mt-1 text-sm text-muted">
          Order {order.id} · {formatGhs(order.totalGhs)} ·{" "}
          {order.paymentMethod === "mtn_momo" ? "MTN Mobile Money" : "Telecel Cash"}
        </p>
        <p className="mt-2 text-xs text-muted">
          Your download links are below and were also sent by email. Links expire in
          48 hours — re-download anytime from your account.
        </p>
      </div>

      <div className="card mt-4">
        <h2 className="section-title !mb-3">Your downloads</h2>
        <DownloadList views={views} />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/account" className="btn-primary">
          Go to my account
        </Link>
        <Link href="/shop" className="btn-ghost">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
