export const metadata = { title: "Delivery Info" };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Delivery &amp; downloads</h1>
      {[
        ["Instant delivery", "The moment payment is confirmed, your files unlock on the confirmation page. Most purchases are downloading within 30 seconds."],
        ["Formats", "Prompt packs: Word (.docx) + PDF. Ebooks: PDF + EPUB. Bundles: one ZIP with everything inside. All formats unlocked with a single purchase."],
        ["Signed links", "Download links are signed and expire after 48 hours for your security. Your account keeps every purchase forever, so you can always generate a fresh link."],
        ["Big files", "Ebooks are 5–30 MB and bundle ZIPs 20–60 MB. Downloads resume if your connection drops, and the dashboard shows exact sizes."],
        ["Email + SMS", "After purchase we email your receipt and links. SMS delivery notifications are coming for even faster access."],
      ].map(([t, b]) => (
        <div key={t} className="card">
          <p className="text-sm font-extrabold text-navy">{t}</p>
          <p className="mt-1 text-sm text-muted">{b}</p>
        </div>
      ))}
    </div>
  );
}
