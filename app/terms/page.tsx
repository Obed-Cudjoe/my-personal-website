export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Terms of service</h1>
      <p className="text-sm text-muted">
        By purchasing from Cudjoe Digital Studio you agree to these terms. Last
        updated August 2026.
      </p>
      {[
        ["Products", "Prompt packs, ebooks and bundles are digital goods. After payment is confirmed you receive a personal, non-transferable licence to use the content for your own work — including commercial client work for the prompts. You may not resell, redistribute or republish the files."],
        ["Payments", "All prices are in Ghana cedis (GH₵) and include no hidden fees. Payments are processed via MTN Mobile Money or Telecel Cash. Your order is fulfilled only after the payment gateway confirms the charge."],
        ["Delivery", "Files are delivered instantly via signed download links that expire after 48 hours; purchases remain re-downloadable from your account indefinitely."],
        ["Refunds", "Within 14 days of purchase you may request a refund if the product does not work as described. Refunds are paid back to the original mobile-money wallet. Download access is revoked after a refund."],
        ["Liability", "Prompts and ebooks are provided 'as is'. You are responsible for reviewing AI-generated output before using it in client work or production systems."],
      ].map(([t, b]) => (
        <div key={t} className="card">
          <p className="text-sm font-extrabold text-navy">{t}</p>
          <p className="mt-1 text-sm text-muted">{b}</p>
        </div>
      ))}
    </div>
  );
}
