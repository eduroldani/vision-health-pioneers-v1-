"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addProfileAssignment,
  addProfileStartupRelation,
  deleteProfile,
  fetchProfileById,
  fetchRoles,
  updateProfileRoles,
} from "@/lib/supabase/profiles";
import {
  assignmentStatusOptions,
  AssignmentRecord,
  ProfileDetailRecord,
  ProfileRecord,
  ProfileRoleRecord,
  RoleRecord,
  startupMemberRelationshipOptions,
  StartupMemberRecord,
  StartupRecord,
} from "@/components/admin/types";
import { ExternalLinkIcons } from "@/components/admin/external-link-icons";

type ProfileDetailPageProps = {
  profileId: string;
};

const defaultStartupRelationValues = {
  startup_id: "",
  relationship_type: "founder",
  notes: "",
};

const defaultAssignmentValues = {
  startup_id: "",
  status: "assigned",
  due_date: "",
  notes: "",
};

export function ProfileDetailPage({ profileId }: ProfileDetailPageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [profileDetail, setProfileDetail] = useState<ProfileDetailRecord | null>(null);
  const [profileRoles, setProfileRoles] = useState<ProfileRoleRecord[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<Pick<ProfileRecord, "id" | "first_name" | "last_name"> | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isStartupModalOpen, setIsStartupModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [startupRelationValues, setStartupRelationValues] = useState(defaultStartupRelationValues);
  const [assignmentValues, setAssignmentValues] = useState(defaultAssignmentValues);
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startupNameById = useMemo(() => {
    return startups.reduce<Record<string, string>>((accumulator, startup) => {
      accumulator[startup.id] = startup.name;
      return accumulator;
    }, {});
  }, [startups]);

  const roleNames = useMemo(
    () => profileRoles.map((profileRole) => profileRole.role?.name).filter((value): value is string => Boolean(value)),
    [profileRoles],
  );

  const missingExtendedDetails = useMemo(() => {
    const needsOperationalDetails = roleNames.some((roleName) =>
      ["coach", "mentor", "team_member"].includes(roleName),
    );

    if (!needsOperationalDetails) {
      return [];
    }

    const missing: string[] = [];

    if (!profileDetail?.profile_status) {
      missing.push("Profile status");
    }
    if (!profileDetail?.internal_code) {
      missing.push("Internal code");
    }
    if (!profileDetail?.drive_url) {
      missing.push("Google Drive Profile URL");
    }
    if (!profileDetail?.agreement_status) {
      missing.push("Agreement status");
    }

    return missing;
  }, [profileDetail, roleNames]);

  useEffect(() => {
    void loadProfile();
  }, [profileId]);

  async function loadProfile() {
    try {
      const [data, roles] = await Promise.all([fetchProfileById(profileId), fetchRoles()]);
      setProfile(data.profile);
      setProfileDetail(data.profileDetail);
      setProfileRoles(data.profileRoles);
      setAvailableRoles(roles);
      setStartupMembers(data.startupMembers);
      setAssignments(data.assignments);
      setStartups(data.startups);
      setCreatorProfile(data.creatorProfile);
      setSelectedRoleIds(data.profileRoles.map((profileRole) => profileRole.role_id));
      setStartupRelationValues((current) => ({
        ...current,
        startup_id: current.startup_id || data.startups[0]?.id || "",
      }));
      setAssignmentValues((current) => ({
        ...current,
        startup_id: current.startup_id || data.startups[0]?.id || "",
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load the profile.");
    } finally {
      setIsLoading(false);
    }
  }

  function formatRoleName(roleName: string) {
    return roleName
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function getProfileName(record: ProfileRecord) {
    return `${record.first_name} ${record.last_name}`.trim();
  }

  function getInitials(record: ProfileRecord) {
    const initials = `${record.first_name.charAt(0)}${record.last_name.charAt(0)}`.trim();
    return initials || "?";
  }

  async function handleSaveRoles() {
    setIsSavingRoles(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfileRoles(profileId, selectedRoleIds);
      const refreshedProfile = await fetchProfileById(profileId);
      setProfileRoles(refreshedProfile.profileRoles);
      setSelectedRoleIds(refreshedProfile.profileRoles.map((profileRole) => profileRole.role_id));
      setSuccessMessage("Profile roles updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the profile roles.");
    } finally {
      setIsSavingRoles(false);
    }
  }

  async function handleAddStartupRelation() {
    setIsSavingRelation(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await addProfileStartupRelation(
        profileId,
        startupRelationValues.startup_id,
        startupRelationValues.relationship_type,
        startupRelationValues.notes,
      );
      setIsStartupModalOpen(false);
      setStartupRelationValues((current) => ({ ...defaultStartupRelationValues, startup_id: current.startup_id }));
      await loadProfile();
      setSuccessMessage("Startup relation added.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add startup relation.");
    } finally {
      setIsSavingRelation(false);
    }
  }

  async function handleAddAssignment() {
    setIsSavingAssignment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await addProfileAssignment(
        profileId,
        assignmentValues.startup_id,
        assignmentValues.status,
        assignmentValues.due_date,
        assignmentValues.notes,
      );
      setIsAssignmentModalOpen(false);
      setAssignmentValues((current) => ({ ...defaultAssignmentValues, startup_id: current.startup_id }));
      await loadProfile();
      setSuccessMessage("Assignment added.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add assignment.");
    } finally {
      setIsSavingAssignment(false);
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
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the profile.");
      setIsDeletingProfile(false);
    }
  }

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>{isLoading ? "Loading profile..." : "Profile"}</h2>
          <p>Review identity, extended details, and direct relations in one place.</p>
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
          <section className="profile-hero">
            <div className="profile-hero-identity">
              <span className={`profile-avatar profile-avatar-large ${missingExtendedDetails.length > 0 ? "profile-avatar-incomplete" : ""}`}>
                {getInitials(profile)}
              </span>
              <div className="profile-hero-copy">
                <h1>{getProfileName(profile)}</h1>
                <div className="profile-hero-meta">
                  <span>{profile.gender ? formatRoleName(profile.gender) : "No gender set"}</span>
                  <span>{profile.email ?? "No email"}</span>
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Created</strong>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <strong>Created by</strong>
                <span>{creatorProfile ? `${creatorProfile.first_name} ${creatorProfile.last_name}` : "Unknown"}</span>
              </div>
              <div className="detail-item">
                <strong>Email</strong>
                <span>{profile.email ?? "No email"}</span>
              </div>
              <div className="detail-item">
                <strong>Links</strong>
                <ExternalLinkIcons linkedinUrl={profile.linkedin_url} websiteUrl={profile.website_url} />
              </div>
            </div>
          </section>

          <section className="detail-panel">
            <strong>Basic information</strong>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>LinkedIn</strong>
                <span>{profile.linkedin_url ?? "Not set"}</span>
              </div>
              <div className="detail-item">
                <strong>Website</strong>
                <span>{profile.website_url ?? "Not set"}</span>
              </div>
            </div>

            {profile.notes ? (
              <div className="record-subsection">
                <strong>Profile notes</strong>
                <span>{profile.notes}</span>
              </div>
            ) : null}
          </section>

          <section className="detail-panel">
            <strong>Profile roles</strong>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Current roles</strong>
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
              </div>
            </div>

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

            <div className="record-actions">
              <button type="button" className="secondary-button inline-button" onClick={handleSaveRoles} disabled={isSavingRoles}>
                {isSavingRoles ? "Saving roles..." : "Save profile roles"}
              </button>
            </div>
          </section>

          <section className="detail-panel">
            <strong>Extended details</strong>
            {missingExtendedDetails.length > 0 ? (
              <div className="detail-warning-grid">
                {missingExtendedDetails.map((item) => (
                  <div key={item} className="detail-warning-item">
                    Missing {item}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="detail-grid">
              <div className={`detail-item ${!profileDetail?.profile_status ? "detail-item-missing" : ""}`}>
                <strong>Profile status</strong>
                <span>{profileDetail?.profile_status ? formatRoleName(profileDetail.profile_status) : "Not set"}</span>
              </div>
              <div className={`detail-item ${!profileDetail?.internal_code ? "detail-item-missing" : ""}`}>
                <strong>Internal code</strong>
                <span>{profileDetail?.internal_code ?? "Not set"}</span>
              </div>
              <div className={`detail-item ${!profileDetail?.agreement_status ? "detail-item-missing" : ""}`}>
                <strong>Agreement status</strong>
                <span>{profileDetail?.agreement_status ? formatRoleName(profileDetail.agreement_status) : "Not set"}</span>
              </div>
              <div className="detail-item">
                <strong>Agreement end date</strong>
                <span>{profileDetail?.agreement_end_date ?? "Not set"}</span>
              </div>
              <div className={`detail-item ${!profileDetail?.drive_url ? "detail-item-missing" : ""}`}>
                <strong>Google Drive Profile URL</strong>
                {profileDetail?.drive_url ? (
                  <a href={profileDetail.drive_url} target="_blank" rel="noreferrer" className="text-link">
                    Open profile folder
                  </a>
                ) : (
                  <span>Not set</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Website status</strong>
                <span>{profileDetail?.website_status ?? "Not set"}</span>
              </div>
              <div className="detail-item">
                <strong>Publication status</strong>
                <span>{profileDetail?.publication_status ?? "Not set"}</span>
              </div>
              <div className="detail-item">
                <strong>Internal note</strong>
                <span>{profileDetail?.admin_notes ?? "No internal note"}</span>
              </div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="record-topline">
              <strong>Related startups</strong>
              <button type="button" className="secondary-button" onClick={() => setIsStartupModalOpen(true)}>
                Add startup relation
              </button>
            </div>
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
                      <span className="pill">{formatRoleName(member.relationship_type)}</span>
                    </div>
                    {member.notes ? <p>{member.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="detail-panel">
            <div className="record-topline">
              <strong>Assignments</strong>
              <button type="button" className="secondary-button" onClick={() => setIsAssignmentModalOpen(true)}>
                Add assignment
              </button>
            </div>
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
                      <span className="pill">{formatRoleName(assignment.status)}</span>
                    </div>
                    <div className="record-meta">
                      <span>{formatRoleName(assignment.assignment_type)}</span>
                      <span>{assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleDateString()}` : "No due date"}</span>
                    </div>
                    {assignment.notes ? <p>{assignment.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {isStartupModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsStartupModalOpen(false)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Add startup relation</h2>
                <p>Connect this person to a startup directly from the profile.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsStartupModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="resource-form">
              <label className="field">
                <span>Startup</span>
                <select
                  value={startupRelationValues.startup_id}
                  onChange={(event) => setStartupRelationValues((current) => ({ ...current, startup_id: event.target.value }))}
                >
                  {startups.map((startup) => (
                    <option key={startup.id} value={startup.id}>
                      {startup.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Relationship type</span>
                <select
                  value={startupRelationValues.relationship_type}
                  onChange={(event) => setStartupRelationValues((current) => ({ ...current, relationship_type: event.target.value }))}
                >
                  {startupMemberRelationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatRoleName(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={startupRelationValues.notes}
                  onChange={(event) => setStartupRelationValues((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="login-button form-action-button" onClick={() => void handleAddStartupRelation()} disabled={isSavingRelation}>
                  {isSavingRelation ? "Saving..." : "Add relation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAssignmentModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsAssignmentModalOpen(false)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Add assignment</h2>
                <p>Create an evaluation assignment directly from the profile.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsAssignmentModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="resource-form">
              <label className="field">
                <span>Startup</span>
                <select
                  value={assignmentValues.startup_id}
                  onChange={(event) => setAssignmentValues((current) => ({ ...current, startup_id: event.target.value }))}
                >
                  {startups.map((startup) => (
                    <option key={startup.id} value={startup.id}>
                      {startup.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={assignmentValues.status}
                  onChange={(event) => setAssignmentValues((current) => ({ ...current, status: event.target.value }))}
                >
                  {assignmentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatRoleName(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Due date</span>
                <input
                  type="datetime-local"
                  value={assignmentValues.due_date}
                  onChange={(event) => setAssignmentValues((current) => ({ ...current, due_date: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={assignmentValues.notes}
                  onChange={(event) => setAssignmentValues((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="login-button form-action-button" onClick={() => void handleAddAssignment()} disabled={isSavingAssignment}>
                  {isSavingAssignment ? "Saving..." : "Add assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
