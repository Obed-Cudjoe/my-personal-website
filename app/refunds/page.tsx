export const metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Refund policy</h1>
      <div className="card">
        <p className="text-sm leading-relaxed text-muted">
          You have <b className="text-navy">14 days</b> from purchase to request a
          refund if a product doesn&apos;t work as described. Refunds are paid back to
          the same mobile-money wallet the payment came from, usually within 1–2
          business days.
        </p>
      </div>
      {[
        ["1 · Contact us", "Email hello@cudjoe.digital (or WhatsApp) with your order number (CDS-XXXX) and the reason."],
        ["2 · We check", "We confirm the order on the payment gateway and revoke download access for that order."],
        ["3 · You get paid", "The refund lands in your MTN MoMo / Telecel Cash wallet. You keep a receipt by email."],
      ].map(([t, b]) => (
        <div key={t} className="card">
          <p className="text-sm font-extrabold text-navy">{t}</p>
          <p className="mt-1 text-sm text-muted">{b}</p>
        </div>
      ))}
      <div className="card border-amber/30 bg-amber-soft">
        <p className="text-sm font-bold text-navy">Not refundable</p>
        <p className="mt-1 text-sm text-muted">
          Lead magnets are free, so nothing to refund. If you downloaded and shared
          files publicly, we may decline a refund — please don&apos;t do that.
        </p>
      </div>
    </div>
  );
}
