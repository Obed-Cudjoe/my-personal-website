"use client";
import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { id: "", label: "All" },
  { id: "prompt", label: "Prompts" },
  { id: "ebook", label: "Ebooks" },
  { id: "bundle", label: "Bundles" },
];

export default function TypeTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("type") ?? "";

  function select(type: string) {
    const next = new URLSearchParams(params.toString());
    if (type) next.set("type", type);
    else next.delete("type");
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => select(t.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
            active === t.id
              ? "bg-navy text-white"
              : "border border-line bg-white text-ink hover:border-muted"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
