import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const links = [
    { href: "/account", label: "Overview" },
    { href: "/account/downloads", label: "Downloads" },
    { href: "/account/orders", label: "Purchase history" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">My account</h1>
          <p className="text-sm text-muted">
            {session.name} · {session.email}
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn-ghost !py-2 text-xs">Log out</button>
        </form>
      </div>
      <nav className="mb-6 flex gap-2 overflow-x-auto">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="chip border border-line bg-white text-ink hover:border-navy">
            {l.label}
          </Link>
        ))}
        {session.role === "admin" && (
          <Link href="/admin" className="chip bg-navy text-white">
            Admin →
          </Link>
        )}
      </nav>
      {children}
    </div>
  );
}
