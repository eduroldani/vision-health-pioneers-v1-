"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAdminSession } from "@/components/admin/use-admin-session";

type AdminLayoutShellProps = {
  children: ReactNode;
};

const primaryNavigationItems = [
  { href: "/admin/startups", label: "Startups" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/assignments", label: "Assignments" },
  { href: "/admin/search", label: "Search" },
];

const quickActionItems = [
  { href: "/admin/startups/new", label: "Add startup" },
  { href: "/admin/profiles/new", label: "Add profile" },
  { href: "/admin/assignments?new=1", label: "Add assignment" },
];

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionState, userEmail, isAdmin, sessionError } = useAdminSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentSearchParams = new URLSearchParams(window.location.search);
    setSearchValue(currentSearchParams.get("q") ?? "");
  }, [pathname]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Something went wrong while signing out.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/admin/search?q=${encodeURIComponent(searchValue.trim())}`);
  }

  if (sessionState === "loading") {
    return (
      <main className="page-shell">
        <section className="admin-card">
          <span className="eyebrow">Internal System</span>
          <h1>Loading workspace</h1>
          <p>Checking your session and preparing the admin area.</p>
        </section>
      </main>
    );
  }

  if (sessionState === "unauthenticated") {
    return null;
  }

  if (sessionState === "unauthorized") {
    return (
      <main className="page-shell">
        <section className="admin-card">
          <span className="eyebrow">Internal System</span>
          <h1>Admin access required</h1>
          <p>Only users marked as admins can open this workspace.</p>
          {sessionError ? <p className="form-message form-message-error">{sessionError}</p> : null}
          <div className="admin-actions">
            <Link href="/" className="secondary-button">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="page-shell page-shell-admin">
      <div className="workspace-shell">
        <header className="topbar-shell">
          <div className="topbar-copy">
            <span className="eyebrow">Internal System</span>
            <h1>Welcome {userEmail.split("@")[0] || "team"},</h1>
            <p>Manage startups and profiles in a simple internal workspace.</p>
          </div>

          <div className="topbar-controls">
            <div className="topbar-actions">
              <Link href="/profile" className="secondary-button">
                My profile
              </Link>
              <Link href="/admin" className="secondary-button">
                Dashboard
              </Link>
            </div>

            <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                className="topbar-search-input"
                placeholder="Global search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
              <button type="submit" className="secondary-button">
                Search
              </button>
            </form>
          </div>
        </header>

        {sessionError ? <p className="form-message form-message-error">{sessionError}</p> : null}
        {signOutError ? <p className="form-message form-message-error">{signOutError}</p> : null}

        <div className="crm-shell">
          <aside className="sidebar-shell">
            <div className="sidebar-section">
              {primaryNavigationItems.map((item) => {
                const [itemPath] = item.href.split("?");
                const isActive =
                  pathname === itemPath ||
                  (itemPath !== "/admin" && pathname.startsWith(`${itemPath}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              {quickActionItems.map((item) => (
                <Link key={item.href} href={item.href} className="sidebar-link sidebar-link-soft">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="session-box sidebar-user-box">
              <strong>Signed in as</strong>
              <span>{userEmail}</span>
              <button
                type="button"
                className="secondary-button sidebar-logout-button"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          </aside>

          <section className="content-shell">{children}</section>
        </div>
      </div>
    </main>
  );
}
