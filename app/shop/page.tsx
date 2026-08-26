import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import TypeTabs from "@/components/TypeTabs";
import SortSelect from "@/components/SortSelect";
import { catalog } from "@/lib/catalog";
import { CATEGORY_LABELS, type Category, type ProductType } from "@/lib/types";

const CATS: (Category | "")[] = [
  "",
  "freelance",
  "marketing",
  "smb",
  "creators",
  "dev",
];

export const metadata = {
  title: "Shop — Prompts, Ebooks & Bundles",
  description:
    "Browse AI prompt packs, practical ebooks and bundles for freelancers, marketers, small business owners, creators and developers.",
};

export default function ShopPage({
  searchParams,
}: {
  searchParams: { type?: string; category?: string; q?: string; sort?: string };
}) {
  const type = (["prompt", "ebook", "bundle"].includes(searchParams.type ?? "")
    ? searchParams.type
    : "") as ProductType | "";
  const category = CATS.includes(searchParams.category as Category)
    ? (searchParams.category as Category | "")
    : "";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const sort = searchParams.sort ?? "popular";

  let products = catalog.all();
  if (type) products = products.filter((p) => p.productType === type);
  if (category) products = products.filter((p) => p.category === category);
  if (q)
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  if (sort === "price_asc") products = [...products].sort((a, b) => a.priceGhs - b.priceGhs);
  if (sort === "price_desc") products = [...products].sort((a, b) => b.priceGhs - a.priceGhs);
  if (sort === "newest")
    products = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-navy">Shop</h1>
        <p className="text-sm text-muted">
          Prompts to copy-paste · ebooks to finish in a weekend · bundles that save
          you ~27%.
        </p>
      </div>

      {/* Search */}
      <form method="get" action="/shop" className="mb-3 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search prompts, ebooks, bundles…"
          className="input flex-1"
          aria-label="Search products"
        />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category" value={category} />
        <button className="btn-primary px-4">Search</button>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <TypeTabs />
        <SortSelect value={sort} />
      </div>

      {/* Category chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATS.map((c) => {
          const active = category === c;
          return (
            <Link
              key={c || "all"}
              href={
                c
                  ? `/shop?type=${type}&category=${c}&q=${q}&sort=${sort}`
                  : `/shop?type=${type}&q=${q}&sort=${sort}`
              }
              className={`chip ${
                active
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-ink hover:border-muted"
              }`}
            >
              {c ? CATEGORY_LABELS[c] : "All categories"}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-bold text-navy">No products match your filters</p>
          <p className="mt-1 text-sm text-muted">Try clearing the search or switching tabs.</p>
          <Link href="/shop" className="btn-ghost mt-4">
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-muted">
            {products.length} product{products.length > 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
