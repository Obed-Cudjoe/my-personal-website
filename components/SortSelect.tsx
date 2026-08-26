"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <select
      name="sort"
      defaultValue={value}
      className="input w-auto py-2 text-sm"
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", e.target.value);
        router.push(`/shop?${next.toString()}`);
      }}
    >
      <option value="popular">Sort: Popular</option>
      <option value="price_asc">Price: low → high</option>
      <option value="price_desc">Price: high → low</option>
      <option value="newest">Newest</option>
    </select>
  );
}
