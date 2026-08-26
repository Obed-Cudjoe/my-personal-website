import BundleBuilder from "@/components/BundleBuilder";
import { catalog } from "@/lib/catalog";

export const metadata = { title: "Admin — Build bundle" };

export default async function NewBundlePage() {
  const packs = catalog.all().filter((p) => p.productType !== "bundle");
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="section-title">Build a bundle</h2>
      <BundleBuilder products={packs.map((p) => ({ id: p.id, sku: p.sku, title: p.title, priceGhs: p.priceGhs, productType: p.productType }))} />
    </div>
  );
}
