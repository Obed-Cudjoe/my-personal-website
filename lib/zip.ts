import fs from "fs";
import path from "path";
import { zipSync, strToU8 } from "fflate";
import { catalog } from "./catalog";
import { storagePath } from "./delivery";

/**
 * Bundle ZIP builder.
 * ZIPs are built when a bundle is created/updated (admin action) and stored
 * under storage/bundles/{id}/bundle.zip — never assembled per-download.
 * Uses fflate (pure JS) so it runs anywhere Node does.
 */

export function buildBundleZip(bundleId: string): { zipPath: string; files: string[] } | null {
  const bundle = catalog.find(bundleId);
  if (!bundle || bundle.productType !== "bundle" || !bundle.items) return null;

  const outDir = path.join(process.cwd(), "storage", "bundles", bundleId);
  fs.mkdirSync(outDir, { recursive: true });

  const files: Record<string, Uint8Array> = {};
  const names: string[] = [];

  for (const item of bundle.items) {
    const product = catalog.find(item.productId);
    if (!product) continue;
    for (const fmt of product.formats) {
      const rel = product.filePaths[fmt];
      if (!rel) continue;
      const abs = storagePath(rel);
      if (!fs.existsSync(abs)) continue;
      const folder =
        product.productType === "ebook" ? `ebooks/${product.sku}` : `prompts/${product.sku}`;
      const ext = fmt === "docx" ? "docx" : fmt;
      const name = `${folder}/${product.sku.toLowerCase()}.${ext}`;
      files[name] = new Uint8Array(fs.readFileSync(abs));
      names.push(name);
    }
  }

  files["README.txt"] = strToU8(
    [
      `${bundle.title}`,
      `Order contents — ${names.length} files`,
      "",
      "Thank you for your purchase from Cudjoe Digital Studio.",
      "Prompt packs: open the .docx to edit or the .pdf to read.",
      "Ebooks: the .epub is for Kindle/Kobo/Apple Books; the .pdf prints.",
      "",
      "Questions? hello@cudjoe.digital",
    ].join("\n")
  );
  names.push("README.txt");

  const outPath = path.join(outDir, "bundle.zip");
  fs.writeFileSync(outPath, zipSync(files, { level: 6 }));

  return { zipPath: `storage/bundles/${bundleId}/bundle.zip`, files: names };
}

export function bundleZipExists(bundleId: string): boolean {
  return fs.existsSync(
    path.join(process.cwd(), "storage", "bundles", bundleId, "bundle.zip")
  );
}
