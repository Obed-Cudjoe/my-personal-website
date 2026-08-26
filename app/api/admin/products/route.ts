import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveOverride } from "@/lib/catalog";
import { nowIso } from "@/lib/util";
import type { Category, FileFormat, Product } from "@/lib/types";

const CATS: Category[] = ["freelance", "marketing", "smb", "creators", "dev"];

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as {
      type?: "prompt" | "ebook";
      sku?: string;
      title?: string;
      description?: string;
      category?: Category;
      priceGhs?: number;
      promptCount?: number;
      pageCount?: number;
      author?: string;
      formats?: FileFormat[];
      toc?: { title: string; pages: number }[];
    };

    if (!body.sku || !body.title || !body.description || !body.priceGhs) {
      return NextResponse.json({ error: "SKU, title, description and price are required." }, { status: 400 });
    }
    if (!body.category || !CATS.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    if (!body.formats?.length) {
      return NextResponse.json({ error: "Choose at least one format." }, { status: 400 });
    }

    const cleanSku = body.sku.toLowerCase().replace(/^(pkg|ebk|bnd)-/, "");
    const id = `${body.type === "ebook" ? "ebk" : "pkg"}-${cleanSku}`;
    const product: Product = {
      id,
      sku: body.sku.toUpperCase(),
      title: body.title.trim(),
      description: body.description.trim(),
      productType: body.type ?? "prompt",
      category: body.category,
      priceGhs: body.priceGhs,
      promptCount: body.type === "prompt" ? body.promptCount ?? 0 : undefined,
      pageCount: body.type === "ebook" ? body.pageCount ?? 0 : undefined,
      author: body.author,
      toc: body.toc,
      formats: body.formats,
      // Files are expected at storage/{type}s/{id}/ — the admin copies them in
      // (see README). Products without files stay hidden from the shop cart.
      filePaths: body.formats.reduce<Record<string, string>>((acc, f) => {
        const ext = f === "docx" ? "docx" : f;
        const name = body.type === "ebook" ? `book.${ext}` : `pack.${ext}`;
        acc[f] = `storage/${body.type ?? "prompt"}s/${id}/${name}`;
        return acc;
      }, {}),
      active: true,
      createdAt: nowIso(),
    };
    saveOverride(product);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    const status = err instanceof Error && err.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Admin access required." }, { status });
  }
}
