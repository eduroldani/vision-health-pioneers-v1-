"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchActiveStartups } from "@/lib/supabase/startups";
import { StartupRecord } from "@/components/admin/types";

export function StartupsListPage() {
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStartups() {
      try {
        setStartups(await fetchActiveStartups());
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load startups right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadStartups();
  }, []);

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>All startups</h2>
          <p>{isLoading ? "Loading startups..." : `${startups.length} startup records`}</p>
        </div>
        <Link href="/admin/startups/new" className="login-button action-card-button">
          Add startup
        </Link>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="records-list">
        {!isLoading && startups.length === 0 ? (
          <div className="empty-state">No startups added yet.</div>
        ) : null}

        {startups.map((startup) => (
          <article key={startup.id} className="record-card">
            <div className="record-topline">
              <Link href={`/admin/startups/${startup.id}`} className="record-title-link">
                {startup.name}
              </Link>
            </div>
            <div className="record-actions">
              <Link href={`/admin/startups/${startup.id}/edit`} className="secondary-button inline-button">
                Edit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
