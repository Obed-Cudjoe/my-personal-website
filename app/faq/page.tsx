export const metadata = { title: "FAQ" };

const FAQS: [string, string][] = [
  [
    "How do I get my files after paying?",
    "The moment your MTN MoMo or Telecel Cash payment is confirmed, your download links unlock automatically on the confirmation page — and we also email them to you. Usually under 30 seconds.",
  ],
  [
    "What if my download link expires?",
    "Links expire after 48 hours for security. Log in (or create an account with the same email) and every purchase stays in My Downloads forever, with fresh links and every format.",
  ],
  [
    "Which formats do you deliver?",
    "Prompt packs: Word (.docx) + PDF. Ebooks: PDF + EPUB (EPUB works on Kindle, Kobo and Apple Books). Bundles: one ZIP containing everything.",
  ],
  [
    "I bought an ebook as PDF — can I get the EPUB?",
    "Yes. Every ebook format is unlocked with your purchase. Go to My Downloads and grab the other format anytime, free.",
  ],
  [
    "How do payments work?",
    "You choose MTN Mobile Money or Telecel Cash at checkout, enter your phone number, and approve the payment prompt on your phone with your MoMo PIN. Nothing is charged until you approve.",
  ],
  [
    "What if the payment fails or I change my mind?",
    "If a payment fails, no money leaves your account and your cart is untouched. After a successful purchase you have 14 days to request a refund — we refund to the same mobile-money wallet.",
  ],
  [
    "Are these prompts really tested?",
    "Yes. Every prompt is run on ChatGPT, Claude and Gemini, with example outputs included so you know what “good” looks like. Prompts also get free updates for 12 months when models change.",
  ],
  [
    "The bundles look too big — what's inside the ZIP?",
    "Each bundle ZIP contains the prompt packs (Word + PDF), the ebooks (PDF + EPUB) and a README. Sizes run 20–60 MB; downloads resume if your connection drops.",
  ],
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-extrabold text-navy">Frequently asked questions</h1>
      <div className="space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="card group">
            <summary className="cursor-pointer list-none text-sm font-extrabold text-navy">
              <span className="mr-2 text-teal-dark">?</span>
              {q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Still stuck?{" "}
        <a href="/contact" className="font-bold text-teal-dark hover:underline">
          Contact us
        </a>{" "}
        — WhatsApp support Mon–Sat, usually within minutes.
      </p>
    </div>
  );
}
