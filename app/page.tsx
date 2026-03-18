import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function HomePage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="page-shell">
      <div className="landing-shell">
        <header className="landing-navbar">
          <span className="eyebrow">Vision Health Pioneers</span>
          <Link href="/admin" className="secondary-button">
            Dashboard
          </Link>
        </header>

        <section className="hero-card">
          <span className="eyebrow">Vision Health Pioneers</span>
          <h1>VHPI Internal System</h1>
          <p>Internal system for startups management</p>
          <div className="system-status" aria-live="polite">
            <span className={`status-dot ${supabaseConfigured ? "status-dot-ready" : ""}`} />
            <span>
              Supabase {supabaseConfigured ? "configured" : "not configured yet"}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
