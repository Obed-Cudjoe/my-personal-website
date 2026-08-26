import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { catalog, saveOverride } from "@/lib/catalog";
import { buildBundleZip } from "@/lib/zip";
import { nowIso } from "@/lib/util";
import type { Category, Product } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as {
      sku?: string;
      title?: string;
      description?: string;
      category?: Category;
      priceGhs?: number;
      items?: string[];
    };
    if (!body.sku || !body.title || !body.description || !body.items || body.items.length < 2) {
      return NextResponse.json({ error: "SKU, title, description and at least 2 items are required." }, { status: 400 });
    }
    const value = body.items.reduce((s, id) => s + (catalog.find(id)?.priceGhs ?? 0), 0);
    if (!body.priceGhs || body.priceGhs >= value) {
      return NextResponse.json(
        { error: "Bundle price must be below the combined value of its items." },
        { status: 400 }
      );
    }

    const id = `bnd-${body.sku.toLowerCase()}`;
    const bundle: Product = {
      id,
      sku: body.sku.toUpperCase(),
      title: body.title.trim(),
      description: body.description.trim(),
      productType: "bundle",
      category: body.category ?? "marketing",
      priceGhs: body.priceGhs,
      items: body.items.map((productId, position) => ({ productId, position })),
      formats: ["zip"],
      filePaths: {},
      active: true,
      createdAt: nowIso(),
    };
    saveOverride(bundle);

    // Build the ZIP immediately.
    const result = buildBundleZip(id);
    if (result) {
      bundle.filePaths = { zip: result.zipPath };
      saveOverride(bundle);
    }

    const pct = value > 0 ? Math.round(((value - body.priceGhs) / value) * 100) : 0;
    return NextResponse.json({ bundle, value, pct, zipBuilt: !!result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
}
