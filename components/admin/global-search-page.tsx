"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAssignments } from "@/lib/supabase/assignments";
import { fetchActiveProfiles } from "@/lib/supabase/profiles";
import { fetchActiveStartups } from "@/lib/supabase/startups";
import { AssignmentRecord, ProfileRecord, StartupRecord } from "@/components/admin/types";

type SearchResult =
  | {
      id: string;
      type: "startup";
      title: string;
      subtitle: string;
      href: string;
      meta: string[];
    }
  | {
      id: string;
      type: "profile";
      title: string;
      subtitle: string;
      href: string;
      meta: string[];
    }
  | {
      id: string;
      type: "assignment";
      title: string;
      subtitle: string;
      href: string;
      meta: string[];
    };

export function GlobalSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    async function loadSearchData() {
      try {
        const [profilesData, startupsData, assignmentsData] = await Promise.all([
          fetchActiveProfiles(),
          fetchActiveStartups(),
          fetchAssignments(),
        ]);

        setProfiles(profilesData);
        setStartups(startupsData);
        setAssignments(assignmentsData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the search index.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSearchData();
  }, []);

  const startupNameById = useMemo(
    () =>
      startups.reduce<Record<string, string>>((accumulator, startup) => {
        accumulator[startup.id] = startup.name;
        return accumulator;
      }, {}),
    [startups],
  );

  const profileNameById = useMemo(
    () =>
      profiles.reduce<Record<string, string>>((accumulator, profile) => {
        accumulator[profile.id] = `${profile.first_name} ${profile.last_name}`.trim();
        return accumulator;
      }, {}),
    [profiles],
  );

  const results = useMemo(() => {
    const normalizedQuery = initialQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [] as SearchResult[];
    }

    const startupResults: SearchResult[] = startups
      .filter((startup) =>
        [
          startup.name,
          startup.cohort,
          startup.notes,
          startup.website_url,
          startup.linkedin_url,
          startup.program_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map((startup) => ({
        id: startup.id,
        type: "startup",
        title: startup.name,
        subtitle: startup.notes ?? "Startup record",
        href: `/admin/startups/${startup.id}`,
        meta: [startup.cohort ?? "No cohort", startup.program_status],
      }));

    const profileResults: SearchResult[] = profiles
      .filter((profile) =>
        [
          profile.first_name,
          profile.last_name,
          profile.email,
          profile.notes,
          profile.linkedin_url,
          profile.website_url,
          profile.gender,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map((profile) => ({
        id: profile.id,
        type: "profile",
        title: `${profile.first_name} ${profile.last_name}`.trim() || "Unnamed profile",
        subtitle: profile.email ?? profile.notes ?? "Profile record",
        href: `/admin/profiles/${profile.id}`,
        meta: [profile.gender ?? "No gender", profile.email ?? "No email"],
      }));

    const assignmentResults: SearchResult[] = assignments
      .filter((assignment) =>
        [
          assignment.status,
          assignment.assignment_type,
          assignment.notes,
          assignment.recommendation,
          startupNameById[assignment.startup_id],
          profileNameById[assignment.profile_id],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map((assignment) => ({
        id: assignment.id,
        type: "assignment",
        title: `${profileNameById[assignment.profile_id] ?? "Unknown profile"} -> ${startupNameById[assignment.startup_id] ?? "Unknown startup"}`,
        subtitle: assignment.notes ?? "Evaluation assignment",
        href: `/admin/assignments/${assignment.id}`,
        meta: [assignment.status, assignment.assignment_type],
      }));

    return [...startupResults, ...profileResults, ...assignmentResults];
  }, [assignments, initialQuery, profileNameById, profiles, startupNameById, startups]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/admin/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>Global search</h2>
          <p>Search across startups, profiles, and assignments from one place.</p>
        </div>
      </div>

      <form className="workspace-search-form" onSubmit={handleSubmit}>
        <input
          type="search"
          className="workspace-search-input"
          placeholder="Search startups, profiles, assignments..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="secondary-button">
          Search
        </button>
      </form>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="record-subsection">
        <strong>Results</strong>
        <span>
          {isLoading
            ? "Loading search index..."
            : initialQuery.trim()
              ? `${results.length} matches for "${initialQuery.trim()}"`
              : "Type something to search the whole workspace."}
        </span>
      </div>

      <div className="search-results-grid">
        {!isLoading && !initialQuery.trim() ? (
          <div className="empty-state">Search by startup name, profile name, email, status, notes, or assignment relations.</div>
        ) : null}

        {!isLoading && initialQuery.trim() && results.length === 0 ? (
          <div className="empty-state">No results found for this search.</div>
        ) : null}

        {results.map((result) => (
          <article key={`${result.type}-${result.id}`} className="search-result-card">
            <div className="search-result-topline">
              <span className={`search-result-type search-result-type-${result.type}`}>
                {result.type}
              </span>
            </div>
            <Link href={result.href} className="record-title-link">
              {result.title}
            </Link>
            <p>{result.subtitle}</p>
            <div className="pill-row">
              {result.meta.map((item) => (
                <span key={`${result.id}-${item}`} className="pill">
                  {item}
                </span>
              ))}
            </div>
            <div className="record-actions search-result-actions">
              <Link href={result.href} className="secondary-button inline-button">
                Open details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
