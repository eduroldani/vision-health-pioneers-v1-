import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="landing-shell">
        <section className="hero-card">
          <span className="eyebrow">Vision Health Pioneers</span>
          <h1>VHPI Internal System</h1>
          <Link href="/admin" className="login-button">
            Enter to dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
