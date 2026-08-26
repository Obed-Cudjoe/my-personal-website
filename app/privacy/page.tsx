export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Privacy policy</h1>
      <p className="text-sm text-muted">
        We collect only what&apos;s needed to sell and deliver digital products. Last
        updated August 2026.
      </p>
      {[
        ["What we collect", "Email and phone number at checkout (for receipts, delivery links and payment), account details if you register, and order history."],
        ["What we never do", "We never sell your data, never send spam, and never store card details — mobile money means payments happen on your phone with your carrier."],
        ["Payment data", "Payment details are handled by MTN Mobile Money / Telecel Cash via Paystack or Flutterwave. We store only the payment reference and status."],
        ["Cookies", "We use strictly necessary cookies for your session and cart. No advertising trackers."],
        ["Your rights", "Email hello@cudjoe.digital to export or delete your data. Deletion also removes your account and download access."],
      ].map(([t, b]) => (
        <div key={t} className="card">
          <p className="text-sm font-extrabold text-navy">{t}</p>
          <p className="mt-1 text-sm text-muted">{b}</p>
        </div>
      ))}
    </div>
  );
}
