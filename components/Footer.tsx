import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-sm font-extrabold text-navy">Cudjoe Digital Studio</p>
          <p className="text-xs leading-relaxed text-muted">
            AI prompt packs, practical ebooks and bundles for African professionals.
            Instant delivery · PDF, Word, EPUB &amp; ZIP · MTN MoMo &amp; Telecel Cash.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Shop</p>
          <ul className="space-y-1.5 text-sm">
            <li><Link className="text-ink hover:text-navy" href="/shop?type=prompt">Prompt Packs</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/shop?type=ebook">Ebooks</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/shop?type=bundle">Bundles</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/free/free-prompts">Free Samples</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Help</p>
          <ul className="space-y-1.5 text-sm">
            <li><Link className="text-ink hover:text-navy" href="/faq">FAQ</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/contact">Contact</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/refunds">Refund Policy</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/delivery">Delivery Info</Link></li>
            <li><Link className="text-ink hover:text-navy" href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-[11px] text-muted">
        © 2026 Cudjoe Digital Studio · Payments via MTN Mobile Money &amp; Telecel Cash
      </div>
    </footer>
  );
}
