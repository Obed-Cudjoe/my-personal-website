import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-black text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Keep your purchases forever, re-download in any format, get updates.
        </p>
        <div className="mt-5">
          <AuthForm mode="signup" />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-teal-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
