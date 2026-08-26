import fs from "fs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCart from "@/components/AddToCart";
import { catalog } from "@/lib/catalog";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/lib/types";
import { formatGhs } from "@/lib/util";
import { storagePath } from "@/lib/delivery";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return catalog
    .all()
    .map((p) => ({ type: p.productType, id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { type: string; id: string };
}): Promise<Metadata> {
  const product = catalog.find(params.id);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      type: "website",
      title: product.title,
      description: product.description,
      images: product.coverPath
        ? [{ url: `/api/files?path=${encodeURIComponent(product.coverPath)}` }]
        : undefined,
    },
  };
}

function sampleText(id: string): string | null {
  const product = catalog.find(id);
  if (!product?.samplePath) return null;
  try {
    return fs.readFileSync(storagePath(product.samplePath), "utf-8").slice(0, 900);
  } catch {
    return null;
  }
}

export default function ProductPage({
  params,
}: {
  params: { type: string; id: string };
}) {
  const product = catalog.find(params.id);
  if (!product || product.productType !== params.type) notFound();

  const isPrompt = product.productType === "prompt";
  const isEbook = product.productType === "ebook";
  const isBundle = product.productType === "bundle";
  const sample = sampleText(product.id);
  const bundleValue = isBundle ? catalog.bundleValue(product) : 0;
  const savings = isBundle ? bundleValue - product.priceGhs : 0;
  const savingsPct = isBundle && bundleValue > 0 ? Math.round((savings / bundleValue) * 100) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* Left: media / cover */}
      <div>
        {isEbook && product.coverPath ? (
          <div className="overflow-hidden rounded-2xl border border-line shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files?path=${encodeURIComponent(product.coverPath)}`}
              alt={`${product.title} cover`}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-navy via-navy-soft to-navy-dark p-8 text-center text-white">
            <span className="chip bg-white/95 text-navy">
              {TYPE_LABELS[product.productType]}
            </span>
            <p className="mt-4 text-2xl font-black">{product.title}</p>
            {isPrompt && (
              <p className="mt-2 text-sm text-white/70">
                {product.promptCount} tested prompts · Word + PDF
              </p>
            )}
            {isBundle && (
              <p className="mt-2 text-sm text-white/70">
                {product.items?.length ?? 0} products · 1 ZIP download
              </p>
            )}
          </div>
        )}

        {/* formats / quick facts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {product.formats.map((f) => (
            <span key={f} className="chip border border-line bg-white text-ink">
              {f === "docx" ? "Word" : f.toUpperCase()}
            </span>
          ))}
          <span className="chip border border-line bg-white text-ink">
            {CATEGORY_LABELS[product.category]}
          </span>
          {isPrompt && (
            <span className="chip border border-line bg-white text-ink">
              {product.promptCount} prompts
            </span>
          )}
          {isEbook && (
            <span className="chip border border-line bg-white text-ink">
              {product.pageCount} pages
            </span>
          )}
        </div>
      </div>

      {/* Right: details */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          {CATEGORY_LABELS[product.category]} · {TYPE_LABELS[product.productType]}
        </p>
        <h1 className="mt-1 text-2xl font-black text-navy sm:text-3xl">{product.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{product.description}</p>

        {/* price block */}
        <div className="mt-5 flex items-end gap-3">
          {isBundle && bundleValue > 0 ? (
            <>
              <p className="text-lg text-muted line-through">{formatGhs(bundleValue)}</p>
              <p className="text-3xl font-black text-navy">{formatGhs(product.priceGhs)}</p>
              <span className="chip bg-teal text-white">Save {savingsPct}% · {formatGhs(savings)}</span>
            </>
          ) : (
            <p className="text-3xl font-black text-navy">{formatGhs(product.priceGhs)}</p>
          )}
        </div>

        {isPrompt && (
          <>
            <div className="card mt-6">
              <h2 className="section-title !mb-2">What&apos;s inside</h2>
              <p className="text-sm text-muted">
                {product.promptCount} prompts, each with context instructions,
                <code className="mx-1 rounded bg-soft px-1.5 py-0.5 font-mono text-xs">[BRACKETED]</code>
                placeholders, an example output and customization notes. Tested on
                ChatGPT, Claude and Gemini. Delivered as Word + PDF.
              </p>
            </div>
            {sample && (
              <div className="card mt-4 border-teal/30 bg-teal-soft">
                <h2 className="section-title !mb-2">Sample — free preview</h2>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 font-mono text-xs leading-relaxed text-ink">
                  {sample}
                </pre>
              </div>
            )}
          </>
        )}

        {isEbook && (
          <>
            <div className="card mt-6">
              <h2 className="section-title !mb-2">Table of contents</h2>
              <ol className="space-y-2">
                {product.toc?.map((c, i) => (
                  <li key={c.title} className="flex items-baseline gap-2 text-sm">
                    <span className="font-mono text-xs font-bold text-teal-dark">{i + 1}</span>
                    <span className="flex-1 text-ink">{c.title}</span>
                    <span className="text-xs text-muted">{c.pages} pp</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card mt-4">
              <h2 className="section-title !mb-1">About the author</h2>
              <p className="text-sm text-muted">
                <b className="text-navy">{product.author}</b> — copywriter, developer and
                AI educator who has spent two years testing prompts across ChatGPT, Claude
                and Gemini so you don&apos;t have to. Based in Accra, Ghana.
              </p>
            </div>
            {product.samplePath && (
              <Link
                href={`/free/free-chapter`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-dark hover:underline"
              >
                ↓ Read Chapter 1 free
              </Link>
            )}
          </>
        )}

        {isBundle && (
          <>
            <div className="card mt-6">
              <h2 className="section-title !mb-3">What&apos;s inside this bundle</h2>
              <ul className="space-y-3">
                {product.items?.map((it) => {
                  const p = catalog.find(it.productId);
                  if (!p) return null;
                  return (
                    <li key={it.productId} className="flex items-start gap-3 rounded-xl border border-line p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft text-lg">
                        {p.productType === "ebook" ? "📖" : "📦"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy">{p.title}</p>
                        <p className="line-clamp-2 text-xs text-muted">{p.description}</p>
                        <p className="mt-0.5 text-xs font-semibold text-ink">
                          {formatGhs(p.priceGhs)} · {p.productType === "ebook" ? "PDF + EPUB" : "Word + PDF"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 rounded-lg bg-soft p-3 text-xs text-muted">
                Everything ships in <b className="text-navy">one ZIP file</b> with a README —
                usually 20–60 MB. Instant download after payment.
              </p>
            </div>
          </>
        )}

        <div className="mt-6">
          <AddToCart
            productId={product.id}
            formats={product.formats}
            defaultFormat={product.formats[0]}
            priceLabel={formatGhs(product.priceGhs)}
          />
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">
          ⚡ Instant delivery · ↩ 14-day refund · 🔄 Free updates for 12 months
        </p>
      </div>
    </div>
  );
}
