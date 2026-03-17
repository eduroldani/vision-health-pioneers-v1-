import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="page-shell">
      <section className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">VHPI Internal System</span>
          <h1>Log in</h1>
          <p>Use your internal account to access the startup management system.</p>
        </div>

        <LoginForm isSupabaseConfigured={supabaseConfigured} />

        <div className="auth-footer">
          <Link href="/" className="text-link">
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
