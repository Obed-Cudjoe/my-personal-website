import Link from "next/link";
import { getSession } from "@/lib/auth";
import { downloads, orders } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export default async function AccountPage() {
  const session = await getSession();
  const userOrders = session ? orders.listByUser(session.userId) : [];
  const userDownloads = session ? downloads.listByUser(session.userId) : [];
  const paid = userOrders.filter((o) => o.status === "paid");

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/account/downloads" className="card block transition hover:border-navy">
        <p className="text-2xl">⬇️</p>
        <p className="mt-1 text-sm font-extrabold text-navy">My downloads</p>
        <p className="text-xs text-muted">
          {userDownloads.length} file{userDownloads.length === 1 ? "" : "s"} unlocked ·
          switch formats
        </p>
      </Link>
      <Link href="/account/orders" className="card block transition hover:border-navy">
        <p className="text-2xl">🧾</p>
        <p className="mt-1 text-sm font-extrabold text-navy">Purchase history</p>
        <p className="text-xs text-muted">
          {paid.length} paid order{paid.length === 1 ? "" : "s"} · receipts
        </p>
      </Link>
      <div className="card">
        <p className="text-2xl">💳</p>
        <p className="mt-1 text-sm font-extrabold text-navy">Total spent</p>
        <p className="text-xs text-muted">
          {formatGhs(paid.reduce((s, o) => s + o.totalGhs, 0))}
        </p>
      </div>
    </div>
  );
}
