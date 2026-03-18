"use client";

import { ReactNode, useState } from "react";
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
];

const quickActionItems = [
  { href: "/admin/startups/new", label: "Add startup" },
  { href: "/admin/profiles/new", label: "Add profile" },
  { href: "/admin/assignments?new=1", label: "Add assignment" },
];

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionState, userEmail, sessionError } = useAdminSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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

  return (
    <main className="page-shell page-shell-admin">
      <div className="workspace-shell">
        <header className="topbar-shell">
          <div className="topbar-copy">
            <span className="eyebrow">Internal System</span>
            <h1>Welcome {userEmail.split("@")[0] || "team"},</h1>
            <p>Manage startups and profiles in a simple internal workspace.</p>
          </div>

          <div className="topbar-actions">
            <Link href="/admin" className="secondary-button">
              Dashboard
            </Link>
            <button
              type="button"
              className="secondary-button"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Log out"}
            </button>
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
            </div>
          </aside>

          <section className="content-shell">{children}</section>
        </div>
      </div>
    </main>
  );
}
