"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProfile, fetchProfileById, fetchRoles, updateProfileRoles } from "@/lib/supabase/profiles";
import {
  AssignmentRecord,
  ProfileRecord,
  ProfileRoleRecord,
  RoleRecord,
  StartupMemberRecord,
  StartupRecord,
} from "@/components/admin/types";
import { ExternalLinkIcons } from "@/components/admin/external-link-icons";

type ProfileDetailPageProps = {
  profileId: string;
};

export function ProfileDetailPage({ profileId }: ProfileDetailPageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [profileRoles, setProfileRoles] = useState<ProfileRoleRecord[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startupNameById = useMemo(() => {
    return startups.reduce<Record<string, string>>((accumulator, startup) => {
      accumulator[startup.id] = startup.name;
      return accumulator;
    }, {});
  }, [startups]);

  function formatRoleName(roleName: string) {
    return roleName
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const [data, roles] = await Promise.all([fetchProfileById(profileId), fetchRoles()]);
        setProfile(data.profile);
        setProfileRoles(data.profileRoles);
        setAvailableRoles(roles);
        setStartupMembers(data.startupMembers);
        setAssignments(data.assignments);
        setStartups(data.startups);
        setSelectedRoleIds(data.profileRoles.map((profileRole) => profileRole.role_id));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [profileId]);

  async function handleSaveRoles() {
    setIsSavingRoles(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfileRoles(profileId, selectedRoleIds);
      const refreshedProfileRoles = await fetchProfileById(profileId);
      setProfileRoles(refreshedProfileRoles.profileRoles);
      setSelectedRoleIds(refreshedProfileRoles.profileRoles.map((profileRole) => profileRole.role_id));
      setSuccessMessage("Profile roles updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update the profile roles.",
      );
    } finally {
      setIsSavingRoles(false);
    }
  }

  async function handleDeleteProfile() {
    if (!window.confirm("Delete this profile? It will be hidden from the system.")) {
      return;
    }

    setIsDeletingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteProfile(profileId);
      router.push("/admin/profiles");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the profile.",
      );
      setIsDeletingProfile(false);
    }
  }

  return (
    <section className="workspace-card page-card">
        <div className="card-heading page-heading">
        <div>
          <h2>
            {isLoading
              ? "Loading profile..."
              : `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Profile detail"}
          </h2>
          <p>Review the profile information and related records.</p>
        </div>
          <div className="record-actions">
            <Link href="/admin/profiles" className="secondary-button">
              Back to profiles
            </Link>
            {profile ? (
              <Link href={`/admin/profiles/${profile.id}/edit`} className="secondary-button">
                Edit profile
              </Link>
            ) : null}
            {profile ? (
              <button
                type="button"
                className="secondary-button"
                onClick={handleDeleteProfile}
                disabled={isDeletingProfile}
              >
                {isDeletingProfile ? "Deleting..." : "Delete profile"}
              </button>
            ) : null}
          </div>
        </div>

      {successMessage ? <p className="form-message form-message-success">{successMessage}</p> : null}
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      {profile ? (
        <div className="detail-stack">
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Gender</strong>
              <span>
                {profile.gender
                  ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                  : "Not set"}
              </span>
            </div>
            <div className="detail-item">
              <strong>Email</strong>
              <span>{profile.email ?? "No email"}</span>
            </div>
            <div className="detail-item">
              <strong>Created at</strong>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <strong>Links</strong>
              <ExternalLinkIcons
                linkedinUrl={profile.linkedin_url}
                websiteUrl={profile.website_url}
              />
            </div>
            <div className="detail-item" />
          </div>

          {profile.notes ? (
            <div className="detail-panel">
              <strong>Notes</strong>
              <p>{profile.notes}</p>
            </div>
          ) : null}

          <div className="detail-panel">
            <strong>Profile roles</strong>
            <p>
              These describe the person&apos;s general contribution across the network, like Coach,
              Evaluator, Mentor, or Founder. They are different from startup-specific relations.
            </p>
            <div className="checkbox-stack">
              {availableRoles.map((role) => (
                <label key={role.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(event) =>
                      setSelectedRoleIds((current) =>
                        event.target.checked
                          ? [...current, role.id]
                          : current.filter((roleId) => roleId !== role.id),
                      )
                    }
                  />
                  <div className="checkbox-copy">
                    <strong>{formatRoleName(role.name)}</strong>
                    <span>{role.description ?? "No description"}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="pill-row">
              {profileRoles.length > 0 ? (
                profileRoles.map((profileRole) =>
                  profileRole.role ? (
                    <span key={profileRole.id} className="pill">
                      {formatRoleName(profileRole.role.name)}
                    </span>
                  ) : null,
                )
              ) : (
                <span className="role-placeholder">No profile roles assigned yet.</span>
              )}
            </div>

            <div className="record-actions">
              <button
                type="button"
                className="secondary-button inline-button"
                onClick={handleSaveRoles}
                disabled={isSavingRoles}
              >
                {isSavingRoles ? "Saving roles..." : "Save profile roles"}
              </button>
            </div>
          </div>

          <div className="detail-panel">
            <strong>Related startups</strong>
            <p>
              These are startup-specific relations. This is where the person is connected to a
              startup as founder, evaluator, mentor, coach, or another relation.
            </p>
            {startupMembers.length === 0 ? (
              <p>No related startups yet.</p>
            ) : (
              <div className="records-list compact-records-list">
                {startupMembers.map((member) => (
                  <article key={member.id} className="record-card">
                    <div className="record-topline">
                      <Link href={`/admin/startups/${member.startup_id}`} className="record-title-link">
                        {startupNameById[member.startup_id] ?? "Unknown startup"}
                      </Link>
                      <span className="pill">{member.relationship_type}</span>
                    </div>
                    {member.notes ? <p>{member.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="detail-panel">
            <strong>Assignments</strong>
            {assignments.length === 0 ? (
              <p>No assignments yet.</p>
            ) : (
              <div className="records-list compact-records-list">
                {assignments.map((assignment) => (
                  <article key={assignment.id} className="record-card">
                    <div className="record-topline">
                      <Link href={`/admin/startups/${assignment.startup_id}`} className="record-title-link">
                        {startupNameById[assignment.startup_id] ?? "Unknown startup"}
                      </Link>
                      <span className="pill">{assignment.status}</span>
                    </div>
                    <div className="record-meta">
                      <span>{assignment.assignment_type}</span>
                      <span>{assignment.score !== null ? `Score ${assignment.score}` : "No score"}</span>
                    </div>
                    <div className="record-subsection">
                      <strong>Relation</strong>
                      <div className="relation-links">
                        <Link href={`/admin/profiles/${profileId}`} className="relation-link">
                          Profile
                        </Link>
                        <Link href={`/admin/startups/${assignment.startup_id}`} className="relation-link">
                          Startup
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
