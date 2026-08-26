export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-extrabold text-navy">Contact us</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-2xl">💬</p>
          <p className="mt-1 text-sm font-extrabold text-navy">WhatsApp</p>
          <p className="text-xs text-muted">+233 24 000 0000 · fastest response</p>
        </div>
        <div className="card">
          <p className="text-2xl">✉️</p>
          <p className="mt-1 text-sm font-extrabold text-navy">Email</p>
          <p className="text-xs text-muted">hello@cudjoe.digital · replies within 24 h</p>
        </div>
        <div className="card">
          <p className="text-2xl">🕘</p>
          <p className="mt-1 text-sm font-extrabold text-navy">Hours</p>
          <p className="text-xs text-muted">Mon–Sat, 9:00–18:00 GMT</p>
        </div>
      </div>
      <div className="card mt-4">
        <p className="text-sm text-muted">
          For refunds, include your order number (e.g. <b className="text-navy">CDS-1024</b>).
          For purchase problems, tell us your payment phone number and we&apos;ll trace
          the order on the gateway side too.
        </p>
      </div>
    </div>
  );
}
