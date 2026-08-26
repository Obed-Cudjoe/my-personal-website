import Link from "next/link";
import { CATEGORY_LABELS, TYPE_LABELS, type Product } from "@/lib/types";
import { catalog } from "@/lib/catalog";
import { formatGhs } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.productType}/${product.id}`;
  const savings =
    product.productType === "bundle" ? catalog.bundleValue(product) : null;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {product.productType === "ebook" ? (
        <div className="relative aspect-[3/4] overflow-hidden bg-navy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files?path=${encodeURIComponent(product.coverPath ?? "")}`}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute left-2 top-2 chip bg-white/95 text-navy">Ebook</span>
        </div>
      ) : (
        <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-navy via-navy-soft to-navy p-4 text-center">
          <span className="chip absolute left-2 top-2 bg-white/95 text-navy">
            {TYPE_LABELS[product.productType]}
          </span>
          {product.productType === "bundle" && savings && savings > 0 && (
            <span className="chip absolute right-2 top-2 bg-teal text-white">
              Save {Math.round(((savings - product.priceGhs) / savings) * 100)}%
            </span>
          )}
          <p className="text-sm font-extrabold leading-snug text-white">
            {product.productType === "prompt"
              ? `${product.promptCount} prompts`
              : `${product.items?.length ?? 0} products inside`}
          </p>
          <p className="mt-1 text-[11px] text-white/70">
            {product.productType === "prompt" ? "Word + PDF" : "One ZIP download"}
          </p>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
          {CATEGORY_LABELS[product.category]}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-extrabold text-navy group-hover:underline">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{product.description}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          {product.productType === "bundle" && savings ? (
            <div>
              <p className="text-[11px] text-muted line-through">
                {formatGhs(savings)}
              </p>
              <p className="text-base font-extrabold text-navy">
                {formatGhs(product.priceGhs)}
              </p>
            </div>
          ) : (
            <p className="text-base font-extrabold text-navy">
              {formatGhs(product.priceGhs)}
            </p>
          )}
          <span className="flex items-center gap-1 text-xs font-bold text-teal-dark">
            Buy <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
