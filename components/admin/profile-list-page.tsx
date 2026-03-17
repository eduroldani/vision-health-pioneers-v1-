"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProfilesOverview } from "@/lib/supabase/profiles";
import { ExternalLinkIcons } from "@/components/admin/external-link-icons";
import {
  AssignmentRecord,
  ProfileRecord,
  ProfileRoleRecord,
  StartupMemberRecord,
} from "@/components/admin/types";

export function ProfilesListPage() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [profileRoles, setProfileRoles] = useState<ProfileRoleRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await fetchProfilesOverview();
        setProfiles(data.profiles);
        setProfileRoles(data.profileRoles);
        setStartupMembers(data.startupMembers);
        setAssignments(data.assignments);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load profiles right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfiles();
  }, []);

  const derivedRolesByProfileId = useMemo(() => {
    const accumulator: Record<string, string[]> = {};

    for (const member of startupMembers) {
      const currentRoles = accumulator[member.profile_id] ?? [];
      if (!currentRoles.includes(member.relationship_type)) {
        currentRoles.push(member.relationship_type);
      }
      accumulator[member.profile_id] = currentRoles;
    }

    for (const assignment of assignments) {
      const currentRoles = accumulator[assignment.profile_id] ?? [];
      if (!currentRoles.includes("evaluator")) {
        currentRoles.push("evaluator");
      }
      accumulator[assignment.profile_id] = currentRoles;
    }

    return accumulator;
  }, [assignments, startupMembers]);

  const globalRolesByProfileId = useMemo(() => {
    const accumulator: Record<string, string[]> = {};

    for (const profileRole of profileRoles) {
      const roleName = profileRole.role?.name;
      if (!roleName) {
        continue;
      }

      const currentRoles = accumulator[profileRole.profile_id] ?? [];
      if (!currentRoles.includes(roleName)) {
        currentRoles.push(roleName);
      }
      accumulator[profileRole.profile_id] = currentRoles;
    }

    return accumulator;
  }, [profileRoles]);

  function formatRoleLabel(role: string) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>All profiles</h2>
          <p>{isLoading ? "Loading profiles..." : `${profiles.length} profiles`}</p>
        </div>
        <Link href="/admin/profiles/new" className="login-button action-card-button">
          Add profile
        </Link>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="records-list">
        {!isLoading && profiles.length === 0 ? (
          <div className="empty-state">No profiles added yet.</div>
        ) : null}

        {profiles.map((profile) => (
          <article key={profile.id} className="record-card">
            <div className="record-topline">
              <Link href={`/admin/profiles/${profile.id}`} className="record-title-link">
                {`${profile.first_name} ${profile.last_name}`.trim()}
              </Link>
            </div>
            <div className="record-subsection">
              <strong>Role</strong>
              <div className="pill-row">
                {(globalRolesByProfileId[profile.id] ?? []).length > 0 ? (
                  (globalRolesByProfileId[profile.id] ?? []).map((role) => (
                    <span key={role} className="pill">
                      {formatRoleLabel(role)}
                    </span>
                  ))
                ) : (
                  (derivedRolesByProfileId[profile.id] ?? []).length > 0 ? (
                    (derivedRolesByProfileId[profile.id] ?? []).map((role) => (
                      <span key={role} className="pill">
                        {formatRoleLabel(role)}
                      </span>
                    ))
                  ) : (
                    <span className="role-placeholder">No role linked yet</span>
                  )
                )}
              </div>
            </div>
            <div className="record-meta">
              <span>{profile.email ?? "No email"}</span>
              <ExternalLinkIcons
                linkedinUrl={profile.linkedin_url}
                websiteUrl={profile.website_url}
              />
            </div>
            {profile.notes ? <p>{profile.notes}</p> : null}
            <div className="record-actions">
              <Link href={`/admin/profiles/${profile.id}/edit`} className="secondary-button inline-button">
                Edit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
