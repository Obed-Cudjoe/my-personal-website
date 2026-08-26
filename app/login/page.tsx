import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-black text-navy">Log in</h1>
        <p className="mt-1 text-sm text-muted">
          Access your downloads, purchase history and format switching.
        </p>
        <div className="mt-5">
          <AuthForm mode="login" />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-bold text-teal-dark hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
