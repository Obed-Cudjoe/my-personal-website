import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/cart";

export default async function Nav() {
  const session = await getSession();
  const cart = await getCart();
  const count = cart.length;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-sm font-black text-white">
            C
          </span>
          <span className="text-sm font-extrabold leading-tight text-navy sm:text-base">
            Cudjoe Digital
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted">
              Studio
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-ink md:flex">
          <Link href="/shop" className="hover:text-navy">Shop</Link>
          <Link href="/shop?type=prompt" className="hover:text-navy">Prompts</Link>
          <Link href="/shop?type=ebook" className="hover:text-navy">Ebooks</Link>
          <Link href="/shop?type=bundle" className="hover:text-navy">Bundles</Link>
          <Link href="/free/free-prompts" className="hover:text-navy">Free</Link>
          <Link href="/faq" className="hover:text-navy">FAQ</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy transition hover:border-muted"
            aria-label="Cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          {session ? (
            <Link
              href={session.role === "admin" ? "/admin" : "/account"}
              className="hidden h-10 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white sm:flex"
            >
              {session.name.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-xl border border-line px-4 text-sm font-bold text-navy sm:flex"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
