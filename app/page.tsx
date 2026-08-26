import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { catalog } from "@/lib/catalog";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

const categories: Category[] = ["freelance", "marketing", "smb", "creators", "dev"];

export default function HomePage() {
  const featured = catalog.all().filter((p) => p.featured).slice(0, 3);
  const prompts = catalog.byType("prompt").length;
  const ebooks = catalog.byType("ebook").length;
  const bundles = catalog.bundles().length;

  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-dark to-navy-soft px-6 py-12 text-center text-white sm:py-16">
        <p className="mx-auto mb-4 w-fit rounded-full border border-white/25 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white/80">
          Built for African professionals
        </p>
        <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
          AI prompts &amp; ebooks that actually work —<br className="hidden sm:block" />
          <span className="text-teal"> without the 300-page textbooks</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
          {prompts} tested prompt packs, {ebooks} short practical ebooks and {bundles}{" "}
          money-saving bundles. Instant download in PDF, Word &amp; EPUB. Pay with
          MTN MoMo or Telecel Cash.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn-teal w-full sm:w-auto">
            Browse the shop
          </Link>
          <Link
            href="/free/free-prompts"
            className="w-full rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
          >
            Get 5 free prompts
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold text-white/60">
          <span>⚡ Instant delivery</span>
          <span>📄 PDF · Word · EPUB · ZIP</span>
          <span>📱 Pay on your phone</span>
          <span>↩ 14-day refund</span>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["📦", "Instant download", "Links unlock the second you pay"],
          ["📱", "MTN MoMo & Telecel Cash", "Approve payment on your phone"],
          ["🎯", "Niche, not mega-packs", "15–45 tested prompts per job"],
          ["🛟", "Human support", "WhatsApp + email, Mon–Sat"],
        ].map(([icon, title, sub]) => (
          <div key={title} className="card flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-extrabold text-navy">{title}</p>
              <p className="mt-0.5 text-xs text-muted">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-navy">Featured products</h2>
            <p className="text-sm text-muted">A prompt pack, an ebook and a bundle — one of each.</p>
          </div>
          <Link href="/shop" className="text-sm font-bold text-teal-dark hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-navy">Shop by job category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c) => {
            const count = catalog.byCategory(c).length;
            return (
              <Link
                key={c}
                href={`/shop?category=${c}`}
                className="card group flex items-center justify-between transition hover:border-navy"
              >
                <div>
                  <p className="text-sm font-extrabold text-navy group-hover:underline">
                    {CATEGORY_LABELS[c]}
                  </p>
                  <p className="text-xs text-muted">{count} products</p>
                </div>
                <span className="text-teal-dark">→</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* LEAD MAGNET BANNER */}
      <section className="rounded-3xl border border-teal/30 bg-teal-soft px-6 py-8 text-center">
        <h2 className="text-xl font-extrabold text-navy">
          Not ready to buy? Test our quality first — free.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          Get 5 full-quality freelance prompts (the same standard as our paid packs)
          plus a free chapter from our best-selling ebook. No card, no MoMo — just
          your email.
        </p>
        <Link href="/free/free-prompts" className="btn-primary mt-5">
          Get my free prompts
        </Link>
      </section>
    </div>
  );
}
