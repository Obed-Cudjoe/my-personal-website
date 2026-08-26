import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/account");

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/products/new?type=prompt", label: "+ Prompt" },
    { href: "/admin/products/new?type=ebook", label: "+ Ebook" },
    { href: "/admin/bundles", label: "Bundles" },
    { href: "/admin/orders", label: "Orders" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Admin dashboard</h1>
          <p className="text-sm text-muted">Manage prompts, ebooks, bundles and orders.</p>
        </div>
        <Link href="/" className="btn-ghost !py-2 text-xs">View storefront →</Link>
      </div>
      <nav className="mb-6 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="chip border border-line bg-white text-ink hover:border-navy">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
