export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold text-navy">About Cudjoe Digital Studio</h1>
      <p className="text-sm leading-relaxed text-muted">
        We make AI actually useful for African professionals. Most prompt packs are
        bloated lists of recycled text; most ebooks are 300-page textbooks that take
        a month to read and a year to forget. We sell the opposite: <b className="text-navy">tested
        prompt packs</b> with example outputs, and <b className="text-navy">short practical ebooks</b> you
        can finish in a weekend and apply on Monday.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Everything is priced in cedis, paid with the mobile money already in your
        phone (MTN MoMo or Telecel Cash), and delivered instantly in the formats you
        actually use — Word and PDF for prompts, PDF and EPUB for ebooks, one ZIP for
        bundles.
      </p>
      <div className="card">
        <p className="section-title !mb-2">Our quality promise</p>
        <ul className="space-y-2 text-sm text-ink">
          <li>• Every prompt tested on ChatGPT, Claude and Gemini before it ships</li>
          <li>• Every ebook has a table of contents, a real cover and zero filler pages</li>
          <li>• Every download is instant, re-downloadable forever, and refundable for 14 days</li>
        </ul>
      </div>
      <p className="text-sm text-muted">
        Founded and run from Accra, Ghana. Questions?{" "}
        <a href="mailto:hello@cudjoe.digital" className="font-bold text-teal-dark hover:underline">
          hello@cudjoe.digital
        </a>
      </p>
    </div>
  );
}
