import { notFound } from "next/navigation";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import { FREE_ITEMS } from "@/lib/catalog";

export function generateStaticParams() {
  return FREE_ITEMS.map((f) => ({ slug: f.id }));
}

export default function FreePage({ params }: { params: { slug: string } }) {
  const item = FREE_ITEMS.find((f) => f.id === params.slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="card border-teal/30 bg-teal-soft">
        <span className="chip bg-white text-teal-dark">FREE</span>
        <h1 className="mt-3 text-2xl font-black text-navy">{item.title}</h1>
        <p className="mt-2 text-sm text-muted">{item.description}</p>
      </div>

      <div className="card mt-4">
        <h2 className="section-title !mb-1">Get it instantly</h2>
        <p className="mb-4 text-xs text-muted">
          Enter your email and we&apos;ll send the download link right away. No spam,
          no payment — ever.
        </p>
        <LeadMagnetForm slug={item.id} />
      </div>

      <div className="card mt-4">
        <h2 className="section-title !mb-2">Why we give this away</h2>
        <p className="text-sm text-muted">
          The digital-product market is full of low-quality prompt lists. We want you
          to see the exact quality of our paid packs before you spend a pesewa. If
          you like it, the shop is one tap away.
        </p>
      </div>
    </div>
  );
}
