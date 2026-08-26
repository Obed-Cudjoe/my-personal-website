import { redirect } from "next/navigation";
import PayScreen from "@/components/PayScreen";
import { orders, payments } from "@/lib/store";
import { formatGhs } from "@/lib/util";

export const metadata = { title: "Complete payment" };

export default async function PayPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const order = searchParams.order ? orders.find(searchParams.order) : undefined;
  if (!order) redirect("/checkout");
  const payment = payments.findByOrder(order.id);
  if (!payment) redirect("/checkout");

  // Already paid? Go to success.
  if (order.status === "paid") redirect(`/checkout/success/${order.id}`);
  if (order.status === "failed") redirect(`/checkout/failed/${order.id}`);

  const method = order.paymentMethod === "mtn_momo" ? "MTN Mobile Money" : "Telecel Cash";

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy">Complete payment</h1>
        <span className="chip bg-soft text-muted">Step 2 of 2</span>
      </div>

      <PayScreen
        orderId={order.id}
        amount={order.totalGhs}
        method={method}
        maskedPhone={order.phone.replace(/^(.{4}).*(.{2})$/, "$1••••••$2")}
        paymentProvider={payment.provider}
      />

      <p className="mt-4 text-center text-xs text-muted">
        Order {order.id} · {formatGhs(order.totalGhs)} · {method}
        <br />
        Downloads unlock automatically — no refresh needed.
      </p>
    </div>
  );
}
