"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { baseAll } from "@/lib/catalogData";
import type { Category, FileFormat, ProductType } from "@/lib/types";

export default function AdminProductForm({ type }: { type: "prompt" | "ebook" }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("freelance");
  const [price, setPrice] = useState("");
  const [promptCount, setPromptCount] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [author, setAuthor] = useState("Obed Cudjoe");
  const [formats, setFormats] = useState<FileFormat[]>(
    type === "ebook" ? ["pdf", "epub"] : ["pdf", "docx"]
  );
  const [tocText, setTocText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function toggleFormat(f: FileFormat) {
    setFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const toc = tocText
        .split("\n")
        .filter(Boolean)
        .map((line, i) => ({ title: line.replace(/\s*\d+\s*pp.*$/, "").trim(), pages: 5 + i }));
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          sku,
          description,
          category,
          priceGhs: parseFloat(price),
          promptCount: promptCount ? parseInt(promptCount, 10) : undefined,
          pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
          author,
          formats,
          toc: toc.length ? toc : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setOk(`Saved ${data.product.sku} — it's live in the shop. Files must exist in /storage/${type}s/${data.product.id}/ (see README).`);
      setTitle(""); setSku(""); setDescription(""); setPrice(""); setPromptCount(""); setPageCount(""); setTocText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const packs = baseAll.filter((p) => p.productType === "prompt");

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder={type === "ebook" ? "EBK-XXX-01" : "PKG-XXX-01"} className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Price (GH₵)</label>
          <input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="85" className="input" required />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pack or ebook title" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">One-line description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does the buyer get?" className="input" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
            <option value="freelance">Freelancers</option>
            <option value="marketing">Marketers</option>
            <option value="smb">Small Business</option>
            <option value="creators">Creators</option>
            <option value="dev">Dev / Analysts</option>
          </select>
        </div>
        {type === "prompt" ? (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Prompt count</label>
            <input type="number" min="1" value={promptCount} onChange={(e) => setPromptCount(e.target.value)} placeholder="15" className="input" />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Pages</label>
            <input type="number" min="1" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="40" className="input" />
          </div>
        )}
        {type === "ebook" && (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input" />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Formats</label>
        <div className="flex gap-2">
          {(type === "ebook" ? ["pdf", "epub"] : ["pdf", "docx"]).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => toggleFormat(f as FileFormat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase transition ${
                formats.includes(f as FileFormat)
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-muted"
              }`}
            >
              {f === "docx" ? "Word" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {type === "ebook" && (
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">
            Table of contents (one chapter per line)
          </label>
          <textarea value={tocText} onChange={(e) => setTocText(e.target.value)} rows={5} placeholder={"Chapter 1 — The AI Tell\nChapter 2 — The Voice Brief"} className="input font-mono text-xs" />
        </div>
      )}

      <div className="rounded-xl bg-soft p-3 text-xs text-muted">
        <b className="text-navy">Files:</b> place the actual files under{" "}
        <code className="font-mono">/storage/{type}s/&lt;id&gt;/</code> before publishing
        (e.g. <code className="font-mono">pack.pdf</code>, <code className="font-mono">pack.docx</code>,
        <code className="font-mono">book.pdf</code>, <code className="font-mono">book.epub</code>,
        <code className="font-mono">cover.jpg</code>). Ids are generated from the SKU.
        {type === "prompt" && (
          <>
            {" "}Available packs with files:{" "}
            {packs.filter((p) => p.filePaths.pdf).map((p) => p.sku).join(", ")}
          </>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-soft p-3 text-xs font-semibold text-red">{error}</p>}
      {ok && <p className="rounded-lg bg-teal-soft p-3 text-xs font-semibold text-teal-dark">{ok}</p>}

      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Saving…" : `Save ${type === "ebook" ? "ebook" : "prompt pack"}`}
      </button>
    </form>
  );
}
