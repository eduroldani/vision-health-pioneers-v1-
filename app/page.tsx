import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function HomePage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Vision Health Pioneers</span>
        <h1>VHPI Internal System</h1>
        <p>Log in in order to access to the startup management system</p>
        <Link href="/login" className="login-button">
          Log in
        </Link>
        <div className="system-status" aria-live="polite">
          <span
            className={`status-dot ${supabaseConfigured ? "status-dot-ready" : ""}`}
          />
          <span>
            Supabase {supabaseConfigured ? "configured" : "not configured yet"}
          </span>
        </div>
      </section>
    </main>
  );
}
