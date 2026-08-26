import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveOverride, catalog } from "@/lib/catalog";
import { buildBundleZip } from "@/lib/zip";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const bundle = catalog.find(params.id);
    if (!bundle || bundle.productType !== "bundle") {
      return NextResponse.json({ error: "Bundle not found." }, { status: 404 });
    }
    const result = buildBundleZip(bundle.id);
    if (!result) {
      return NextResponse.json({ error: "ZIP build failed — component files missing." }, { status: 400 });
    }
    bundle.filePaths = { zip: result.zipPath };
    saveOverride(bundle);
    return NextResponse.json({ ok: true, zipPath: result.zipPath, files: result.files });
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
}
