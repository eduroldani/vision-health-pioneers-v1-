"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchStartupsOverview } from "@/lib/supabase/startups";
import {
  AssignmentRecord,
  StartupMemberWithProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

export function StartupsListPage() {
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberWithProfileRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStartups() {
      try {
        const data = await fetchStartupsOverview();
        setStartups(data.startups);
        setStartupMembers(data.startupMembers);
        setAssignments(data.assignments);
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

  const membersByStartupId = useMemo(() => {
    return startupMembers.reduce<Record<string, StartupMemberWithProfileRecord[]>>(
      (accumulator, member) => {
        if (
          member.relationship_type !== "founder" &&
          member.relationship_type !== "cofounder"
        ) {
          return accumulator;
        }

        const currentMembers = accumulator[member.startup_id] ?? [];
        currentMembers.push(member);
        accumulator[member.startup_id] = currentMembers;
        return accumulator;
      },
      {},
    );
  }, [startupMembers]);

  const pendingAssignmentsByStartupId = useMemo(() => {
    return assignments.reduce<Record<string, number>>((accumulator, assignment) => {
      if (assignment.status === "submitted") {
        return accumulator;
      }

      accumulator[assignment.startup_id] = (accumulator[assignment.startup_id] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [assignments]);

  function getInitials(startupMember: StartupMemberWithProfileRecord) {
    const firstName = startupMember.profile?.first_name ?? "";
    const lastName = startupMember.profile?.last_name ?? "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();
    return initials || "?";
  }

  const sortedStartups = useMemo(() => {
    const nextStartups = [...startups];

    nextStartups.sort((left, right) => {
      if (sortBy === "name_asc") {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === "name_desc") {
        return right.name.localeCompare(left.name);
      }

      if (sortBy === "created_oldest") {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });

    return nextStartups;
  }, [sortBy, startups]);

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>All startups</h2>
          <p>{isLoading ? "Loading startups..." : `${startups.length} startup records`}</p>
        </div>
        <div className="page-controls">
          <label className="toolbar-select">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="created_newest">Created date: newest</option>
              <option value="created_oldest">Created date: oldest</option>
            </select>
          </label>
          <Link href="/admin/startups/new" className="login-button action-card-button">
            Add startup
          </Link>
        </div>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="startup-gallery">
        {!isLoading && sortedStartups.length === 0 ? (
          <div className="empty-state">No startups added yet.</div>
        ) : null}

        {sortedStartups.map((startup) => (
          <article key={startup.id} className="startup-gallery-card">
            <div className="startup-gallery-topline">
              <div className="startup-gallery-header">
                <div className="startup-gallery-title-row">
                  <Link href={`/admin/startups/${startup.id}`} className="record-title-link">
                    {startup.name}
                  </Link>
                  <span className="startup-gallery-cohort">
                    {startup.cohort ? `Cohort ${startup.cohort}` : "No cohort"}
                  </span>
                </div>
                <span
                  className={`status-badge status-badge-${startup.program_status.replaceAll("_", "-")}`}
                >
                  {startup.program_status}
                </span>
              </div>
            </div>
            <div className="startup-gallery-meta">
              <span
                className={`status-badge ${pendingAssignmentsByStartupId[startup.id] ? "status-badge-in-progress" : "status-badge-completed"}`}
              >
                {pendingAssignmentsByStartupId[startup.id] ?? 0} pending assignments
              </span>
            </div>
            {startup.notes ? <p className="startup-gallery-notes">{startup.notes}</p> : null}

            <div className="startup-gallery-team">
              <strong>Team</strong>
              {(membersByStartupId[startup.id] ?? []).length > 0 ? (
                <div className="startup-team-avatars">
                  {(membersByStartupId[startup.id] ?? []).slice(0, 5).map((member) => (
                    <Link
                      key={member.id}
                      href={`/admin/profiles/${member.profile_id}`}
                      className="startup-team-avatar-link"
                      aria-label={member.profile ? `${member.profile.first_name} ${member.profile.last_name}` : "Open profile"}
                    >
                      <span className="startup-team-avatar">{getInitials(member)}</span>
                    </Link>
                  ))}
                  {(membersByStartupId[startup.id] ?? []).length > 5 ? (
                    <span className="startup-team-overflow">
                      +{(membersByStartupId[startup.id] ?? []).length - 5}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="role-placeholder">No team linked yet</span>
              )}
            </div>
            <div className="record-actions">
              <Link href={`/admin/startups/${startup.id}`} className="secondary-button inline-button">
                View
              </Link>
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
