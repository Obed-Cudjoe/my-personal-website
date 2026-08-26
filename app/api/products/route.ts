import { NextRequest, NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

/** Product listing with type filtering, category, search and sort. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "";
  const category = sp.get("category") ?? "";
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const sort = sp.get("sort") ?? "popular";

  let products = catalog.all();
  if (type) products = products.filter((p) => p.productType === type);
  if (category) products = products.filter((p) => p.category === category);
  if (q)
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  if (sort === "price_asc") products.sort((a, b) => a.priceGhs - b.priceGhs);
  if (sort === "price_desc") products.sort((a, b) => b.priceGhs - a.priceGhs);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      title: p.title,
      description: p.description,
      productType: p.productType,
      category: p.category,
      priceGhs: p.priceGhs,
      promptCount: p.promptCount,
      pageCount: p.pageCount,
      formats: p.formats,
    })),
  });
}
