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
  const [sortBy, setSortBy] = useState("name_asc");
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
    return role
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function getProfileName(profile: ProfileRecord) {
    return `${profile.first_name} ${profile.last_name}`.trim() || "Unnamed profile";
  }

  function getInitials(profile: ProfileRecord) {
    const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.trim();
    return initials || "?";
  }

  const sortedProfiles = useMemo(() => {
    const nextProfiles = [...profiles];

    nextProfiles.sort((left, right) => {
      if (sortBy === "name_asc") {
        return getProfileName(left).localeCompare(getProfileName(right));
      }

      if (sortBy === "name_desc") {
        return getProfileName(right).localeCompare(getProfileName(left));
      }

      if (sortBy === "created_oldest") {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });

    return nextProfiles;
  }, [profiles, sortBy]);

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>All profiles</h2>
          <p>{isLoading ? "Loading profiles..." : `${profiles.length} profiles`}</p>
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
          <Link href="/admin/profiles/new" className="login-button action-card-button">
            Add profile
          </Link>
        </div>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="profiles-gallery">
        {!isLoading && sortedProfiles.length === 0 ? (
          <div className="empty-state">No profiles added yet.</div>
        ) : null}

        {sortedProfiles.map((profile) => (
          <article key={profile.id} className="profile-gallery-card">
            <div className="profile-gallery-header">
              <Link href={`/admin/profiles/${profile.id}`} className="profile-avatar-link" aria-label={`Open ${getProfileName(profile)}`}>
                <span className="profile-avatar">{getInitials(profile)}</span>
              </Link>
              <ExternalLinkIcons
                linkedinUrl={profile.linkedin_url}
                websiteUrl={profile.website_url}
              />
            </div>

            <div className="profile-gallery-body">
              <Link href={`/admin/profiles/${profile.id}`} className="record-title-link">
                {getProfileName(profile)}
              </Link>
              <div className="profile-gallery-email">{profile.email ?? "No email"}</div>
            </div>

            <div className="record-subsection profile-gallery-roles">
              <strong>Roles</strong>
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

            {profile.notes ? <p className="profile-gallery-notes">{profile.notes}</p> : null}

            <div className="record-actions profile-gallery-actions">
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
