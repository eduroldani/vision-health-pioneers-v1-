"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProfilesOverview } from "@/lib/supabase/profiles";
import { ExternalLinkIcons } from "@/components/admin/external-link-icons";
import {
  AssignmentRecord,
  ProfileDetailRecord,
  ProfileRecord,
  ProfileRoleRecord,
  StartupMemberRecord,
} from "@/components/admin/types";

export function ProfilesListPage() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetailRecord[]>([]);
  const [profileRoles, setProfileRoles] = useState<ProfileRoleRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [sortBy, setSortBy] = useState("created_newest");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIssueProfileId, setSelectedIssueProfileId] = useState<string | null>(null);
  const [copiedEmailProfileId, setCopiedEmailProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await fetchProfilesOverview();
        setProfiles(data.profiles);
        setProfileDetails(data.profileDetails);
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

  const profileDetailByProfileId = useMemo(() => {
    return profileDetails.reduce<Record<string, ProfileDetailRecord>>((accumulator, detail) => {
      accumulator[detail.profile_id] = detail;
      return accumulator;
    }, {});
  }, [profileDetails]);

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

  function getCombinedRoles(profileId: string) {
    const roleNames = [...(globalRolesByProfileId[profileId] ?? [])];

    for (const derivedRole of derivedRolesByProfileId[profileId] ?? []) {
      if (!roleNames.includes(derivedRole)) {
        roleNames.push(derivedRole);
      }
    }

    return roleNames;
  }

  function isOperationallyIncomplete(profileId: string) {
    const roleNames = getCombinedRoles(profileId);
    const needsOperationalDetails = roleNames.some((roleName) =>
      ["coach", "mentor", "team_member"].includes(roleName),
    );

    if (!needsOperationalDetails) {
      return false;
    }

    const detail = profileDetailByProfileId[profileId];
    if (!detail) {
      return true;
    }

    return !detail.profile_status || !detail.internal_code || !detail.drive_url || !detail.agreement_status;
  }

  function getMissingInfoMessage(profileId: string) {
    if (!isOperationallyIncomplete(profileId)) {
      return "";
    }

    const detail = profileDetailByProfileId[profileId];
    const missing: string[] = [];

    if (!detail?.profile_status) {
      missing.push("profile status");
    }
    if (!detail?.internal_code) {
      missing.push("internal code");
    }
    if (!detail?.drive_url) {
      missing.push("drive URL");
    }
    if (!detail?.agreement_status) {
      missing.push("agreement status");
    }

    return `Missing: ${missing.join(", ")}`;
  }

  function getMissingInfoList(profileId: string) {
    if (!isOperationallyIncomplete(profileId)) {
      return [];
    }

    const detail = profileDetailByProfileId[profileId];
    const missing: string[] = [];

    if (!detail?.profile_status) {
      missing.push("Profile status");
    }
    if (!detail?.internal_code) {
      missing.push("Internal code");
    }
    if (!detail?.drive_url) {
      missing.push("Drive URL");
    }
    if (!detail?.agreement_status) {
      missing.push("Agreement status");
    }

    return missing;
  }

  async function handleCopyEmail(profile: ProfileRecord) {
    if (!profile.email) {
      return;
    }

    await navigator.clipboard.writeText(profile.email);
    setCopiedEmailProfileId(profile.id);
    window.setTimeout(() => {
      setCopiedEmailProfileId((current) => (current === profile.id ? null : current));
    }, 1600);
  }

  const visibleProfiles = useMemo(() => {
    if (roleFilter === "all") {
      return profiles;
    }

    return profiles.filter((profile) => getCombinedRoles(profile.id).includes(roleFilter));
  }, [profiles, roleFilter, globalRolesByProfileId, derivedRolesByProfileId]);

  const sortedProfiles = useMemo(() => {
    const nextProfiles = [...visibleProfiles];

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
  }, [visibleProfiles, sortBy]);

  const filterItems = [
    { value: "all", label: "All" },
    { value: "coach", label: "Coaches" },
    { value: "mentor", label: "Mentors" },
    { value: "founder", label: "Founders" },
    { value: "team_member", label: "Team" },
    { value: "evaluator", label: "Evaluators" },
  ];

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

      <div className="profile-filter-row">
        {filterItems.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`profile-filter-chip ${roleFilter === item.value ? "profile-filter-chip-active" : ""}`}
            onClick={() => setRoleFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="profiles-gallery">
        {!isLoading && sortedProfiles.length === 0 ? (
          <div className="empty-state">No profiles added yet.</div>
        ) : null}

        {sortedProfiles.map((profile) => (
          <article
            key={profile.id}
            className={`profile-gallery-card ${isOperationallyIncomplete(profile.id) ? "profile-gallery-card-incomplete" : ""}`}
          >
            <div className="profile-gallery-header">
              <div className="profile-avatar-stack">
                <Link href={`/admin/profiles/${profile.id}`} className="profile-avatar-link" aria-label={`Open ${getProfileName(profile)}`}>
                  <span
                    className={`profile-avatar ${isOperationallyIncomplete(profile.id) ? "profile-avatar-incomplete" : ""}`}
                  >
                    {getInitials(profile)}
                  </span>
                </Link>
                {isOperationallyIncomplete(profile.id) ? (
                  <button
                    type="button"
                    className="profile-avatar-info"
                    onClick={() => setSelectedIssueProfileId(profile.id)}
                    aria-label={`Show missing information for ${getProfileName(profile)}`}
                    title={getMissingInfoMessage(profile.id)}
                  >
                    i
                  </button>
                ) : null}
              </div>
              <ExternalLinkIcons
                linkedinUrl={profile.linkedin_url}
                websiteUrl={profile.website_url}
              />
            </div>

            <div className="profile-gallery-body">
              <Link href={`/admin/profiles/${profile.id}`} className="record-title-link">
                {getProfileName(profile)}
              </Link>
              <div className="profile-gallery-meta-row">
                <span
                  className={`status-badge ${
                    profileDetailByProfileId[profile.id]?.profile_status
                      ? `status-badge-${profileDetailByProfileId[profile.id]?.profile_status?.replaceAll("_", "-")}`
                      : "status-badge-not-assigned"
                  }`}
                >
                  {profileDetailByProfileId[profile.id]?.profile_status
                    ? formatRoleLabel(profileDetailByProfileId[profile.id]!.profile_status!)
                    : "No status"}
                </span>
              </div>
              <div className="profile-gallery-email-row">
                {profile.email ? (
                  <button
                    type="button"
                    className={`profile-email-button ${copiedEmailProfileId === profile.id ? "profile-email-button-copied" : ""}`}
                    onClick={() => void handleCopyEmail(profile)}
                    title="Click to copy email"
                  >
                    <span className="profile-email-copy-icon" aria-hidden="true">
                      {copiedEmailProfileId === profile.id ? (
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M9.6 16.6 5.9 13l1.4-1.4 2.3 2.2 6.9-6.8 1.4 1.4-8.3 8.2Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M9 9.5A2.5 2.5 0 0 1 11.5 7h6A2.5 2.5 0 0 1 20 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 9 17.5v-8Zm2.5-.7a.7.7 0 0 0-.7.7v8c0 .4.3.7.7.7h6c.4 0 .7-.3.7-.7v-8a.7.7 0 0 0-.7-.7h-6ZM5.8 4h7.7a.9.9 0 1 1 0 1.8H5.8c-.6 0-1 .4-1 1v9.7a.9.9 0 1 1-1.8 0V6.8A2.8 2.8 0 0 1 5.8 4Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </span>
                    <span>{copiedEmailProfileId === profile.id ? "Copied email" : profile.email}</span>
                  </button>
                ) : (
                  <div className="profile-gallery-email">No email</div>
                )}
              </div>
            </div>

            <div className="record-subsection profile-gallery-roles">
              <strong>Roles</strong>
              <div className="pill-row">
                {getCombinedRoles(profile.id).length > 0 ? (
                  getCombinedRoles(profile.id).map((role) => (
                    <span key={role} className="pill">
                      {formatRoleLabel(role)}
                    </span>
                  ))
                ) : (
                  <span className="role-placeholder">No role linked yet</span>
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

      {selectedIssueProfileId ? (
        <div className="modal-backdrop" onClick={() => setSelectedIssueProfileId(null)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Missing profile information</h2>
                <p>
                  {profiles.find((profile) => profile.id === selectedIssueProfileId)
                    ? getProfileName(profiles.find((profile) => profile.id === selectedIssueProfileId)!)
                    : "Profile"}
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedIssueProfileId(null)}>
                Close
              </button>
            </div>

            <div className="records-list compact-records-list">
              {getMissingInfoList(selectedIssueProfileId).map((item) => (
                <article key={item} className="record-card">
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
