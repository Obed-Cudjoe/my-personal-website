"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/shop", label: "Shop", icon: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" },
  { href: "/free/free-prompts", label: "Free", icon: "M20 12V8H4v4M2 8h20v4a2 2 0 01-2 2H4a2 2 0 01-2-2V8zm2 10h16" },
  { href: "/cart", label: "Cart", icon: "M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" },
  { href: "/account", label: "Account", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-safe md:hidden">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                active ? "text-teal-dark" : "text-muted"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={it.icon} />
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
