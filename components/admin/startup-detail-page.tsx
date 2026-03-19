"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addStartupMember,
  archiveStartupMember,
  defaultStartupMemberFormValues,
  deleteStartup,
  fetchStartupDetailById,
  type StartupMemberFormValues,
} from "@/lib/supabase/startups";
import {
  createAssignment,
  defaultAssignmentFormValues,
  fetchAssignments,
  fetchAssignmentDependencies,
  getAssignmentFormValues,
  isAssignmentOverdue,
  type AssignmentFormValues,
  updateAssignment,
} from "@/lib/supabase/assignments";
import {
  AssignmentRecord,
  ProfileRecord,
  ProfileRoleRecord,
  StartupMemberWithProfileRecord,
  StartupRecord,
  startupMemberRelationshipOptions,
} from "@/components/admin/types";
import { AssignmentForm } from "@/components/admin/assignment-form";
import { ExternalLinkIcons } from "@/components/admin/external-link-icons";
import { useAdminSession } from "@/components/admin/use-admin-session";

type StartupDetailPageProps = {
  startupId: string;
};

export function StartupDetailPage({ startupId }: StartupDetailPageProps) {
  const router = useRouter();
  const { userEmail, userId } = useAdminSession();
  const [startup, setStartup] = useState<StartupRecord | null>(null);
  const [startupMembers, setStartupMembers] = useState<StartupMemberWithProfileRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [profileRoles, setProfileRoles] = useState<ProfileRoleRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [memberForm, setMemberForm] = useState<StartupMemberFormValues>(
    defaultStartupMemberFormValues,
  );
  const [assignmentFormValues, setAssignmentFormValues] = useState<AssignmentFormValues>({
    ...defaultAssignmentFormValues,
    startup_id: startupId,
  });
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [isDeletingStartup, setIsDeletingStartup] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startupMemberProfiles = useMemo(
    () =>
      startupMembers.filter(
        (member) =>
          member.relationship_type === "founder" || member.relationship_type === "cofounder",
      ),
    [startupMembers],
  );

  const relatedProfiles = useMemo(
    () =>
      startupMembers.filter(
        (member) =>
          member.relationship_type !== "founder" && member.relationship_type !== "cofounder",
      ),
    [startupMembers],
  );

  const availableProfiles = useMemo(() => {
    const linkedProfileIds = new Set(startupMembers.map((member) => member.profile_id));
    return profiles.filter((profile) => !linkedProfileIds.has(profile.id));
  }, [profiles, startupMembers]);

  const profileNameById = useMemo(
    () =>
      profiles.reduce<Record<string, string>>((accumulator, profile) => {
        accumulator[profile.id] = `${profile.first_name} ${profile.last_name}`.trim();
        return accumulator;
      }, {}),
    [profiles],
  );

  const startupSummary = useMemo(() => {
    const submittedAssignments = assignments.filter((assignment) => assignment.status === "submitted");

    return {
      relatedProfiles: startupMembers.length,
      evaluationAssignments: assignments.length,
      submittedEvaluations: submittedAssignments.length,
      teamMembers: startupMemberProfiles.length,
    };
  }, [assignments, startupMembers.length, startupMemberProfiles.length]);

  const creatorLabel =
    startup?.created_by && startup.created_by === userId && userEmail ? userEmail : "Internal user";

  useEffect(() => {
    async function loadStartupDetail() {
      try {
        const [data, assignmentData, dependencyData] = await Promise.all([
          fetchStartupDetailById(startupId),
          fetchAssignments({ startup_id: startupId }),
          fetchAssignmentDependencies(),
        ]);

        const linkedProfileIds = new Set(data.startupMembers.map((member) => member.profile_id));
        const nextAvailableProfiles = data.profiles.filter(
          (profile) => !linkedProfileIds.has(profile.id),
        );

        setStartup(data.startup);
        setStartupMembers(data.startupMembers);
        setProfiles(dependencyData.profiles.length > 0 ? dependencyData.profiles : data.profiles);
        setProfileRoles(data.profileRoles);
        setAssignments(assignmentData);
        setMemberForm((current) => ({
          ...current,
          profile_id:
            current.profile_id &&
            nextAvailableProfiles.some((profile) => profile.id === current.profile_id)
              ? current.profile_id
              : (nextAvailableProfiles[0]?.id ?? ""),
        }));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the startup detail.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadStartupDetail();
  }, [startupId]);

  async function refreshStartupDetail() {
    const [data, assignmentData, dependencyData] = await Promise.all([
      fetchStartupDetailById(startupId),
      fetchAssignments({ startup_id: startupId }),
      fetchAssignmentDependencies(),
    ]);

    const linkedProfileIds = new Set(data.startupMembers.map((member) => member.profile_id));
    const nextAvailableProfiles = data.profiles.filter(
      (profile) => !linkedProfileIds.has(profile.id),
    );

    setStartup(data.startup);
    setStartupMembers(data.startupMembers);
    setProfiles(dependencyData.profiles.length > 0 ? dependencyData.profiles : data.profiles);
    setProfileRoles(data.profileRoles);
    setAssignments(assignmentData);
    setMemberForm((current) => ({
      ...current,
      profile_id:
        current.profile_id &&
        nextAvailableProfiles.some((profile) => profile.id === current.profile_id)
          ? current.profile_id
          : (nextAvailableProfiles[0]?.id ?? ""),
    }));
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await addStartupMember(startupId, memberForm);
      await refreshStartupDetail();
      setIsRelationModalOpen(false);
      setSuccessMessage("Profile linked to startup.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to link the profile right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchiveMember(startupMemberId: string) {
    setRemovingMemberId(startupMemberId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await archiveStartupMember(startupMemberId);
      await refreshStartupDetail();
      setSuccessMessage("Relationship removed from the startup.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to remove the relationship right now.",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleAssignmentSubmit(values: AssignmentFormValues) {
    setIsAssignmentSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingAssignmentId) {
        await updateAssignment(editingAssignmentId, values);
      } else {
        await createAssignment(values);
      }

      await refreshStartupDetail();
      setAssignmentFormValues({
        ...defaultAssignmentFormValues,
        startup_id: startupId,
      });
      setEditingAssignmentId(null);
      setIsAssignmentModalOpen(false);
      setSuccessMessage(
        editingAssignmentId ? "Assignment updated successfully." : "Assignment created successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the assignment right now.",
      );
      throw error;
    } finally {
      setIsAssignmentSubmitting(false);
    }
  }

  function handleEditAssignment(assignment: AssignmentRecord) {
    setEditingAssignmentId(assignment.id);
    setAssignmentFormValues(getAssignmentFormValues(assignment));
    setIsAssignmentModalOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleCloseAssignmentModal() {
    setEditingAssignmentId(null);
    setAssignmentFormValues({
      ...defaultAssignmentFormValues,
      startup_id: startupId,
    });
    setIsAssignmentModalOpen(false);
  }

  function getStatusBadgeClass(value: string) {
    return `status-badge status-badge-${value.replaceAll("_", "-")}`;
  }

  async function handleDeleteStartup() {
    if (!window.confirm("Delete this startup? It will be hidden from the system.")) {
      return;
    }

    setIsDeletingStartup(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteStartup(startupId);
      router.push("/admin/startups");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the startup.",
      );
      setIsDeletingStartup(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>{isLoading ? "Loading startup..." : startup?.name ?? "Startup detail"}</h2>
            <p>Clear operational view for demo, follow up, and control.</p>
          </div>
          <div className="record-actions">
            <Link href="/admin/startups" className="secondary-button">
              Back to startups
            </Link>
            {startup ? (
              <Link href={`/admin/startups/${startup.id}/edit`} className="secondary-button">
                Edit startup
              </Link>
            ) : null}
            {startup ? (
              <button
                type="button"
                className="secondary-button"
                onClick={handleDeleteStartup}
                disabled={isDeletingStartup}
              >
                {isDeletingStartup ? "Deleting..." : "Delete startup"}
              </button>
            ) : null}
          </div>
        </div>

        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-message form-message-success">{successMessage}</p> : null}

        {startup ? (
          <div className="detail-stack">
            <div className="detail-panel startup-operations-panel">
              <div className="startup-operations-header">
                <div>
                  <strong>Operations overview</strong>
                  <p>Quick actions and high-level visibility for this startup.</p>
                </div>
                <div className="record-actions">
                  <button
                    type="button"
                    className="login-button admin-button"
                    onClick={() => setIsAssignmentModalOpen(true)}
                  >
                    New assignment
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setIsRelationModalOpen(true)}
                  >
                    Add relation
                  </button>
                </div>
              </div>
            </div>

            <div className="detail-grid detail-grid-compact">
              <div className="detail-item">
                <strong>Assigned to evaluation</strong>
                <span>{startupSummary.evaluationAssignments}</span>
              </div>
              <div className="detail-item">
                <strong>Submitted</strong>
                <span>{startupSummary.submittedEvaluations}</span>
              </div>
              <div className="detail-item">
                <strong>Related profiles</strong>
                <span>{startupSummary.relatedProfiles}</span>
              </div>
              <div className="detail-item">
                <strong>Startup members</strong>
                <span>{startupSummary.teamMembers}</span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Eligibility status</strong>
                <span className={getStatusBadgeClass(startup.eligibility_status)}>
                  {startup.eligibility_status}
                </span>
              </div>
              <div className="detail-item">
                <strong>Evaluation status</strong>
                <span className={getStatusBadgeClass(startup.evaluation_status)}>
                  {startup.evaluation_status}
                </span>
              </div>
              <div className="detail-item">
                <strong>Program status</strong>
                <span className={getStatusBadgeClass(startup.program_status)}>
                  {startup.program_status}
                </span>
              </div>
              <div className="detail-item">
                <strong>Cohort</strong>
                <span>{startup.cohort ?? "No cohort"}</span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Links</strong>
                <ExternalLinkIcons
                  notionUrl={startup.notion_page_url}
                  websiteUrl={startup.website_url}
                  instagramUrl={startup.instagram_url}
                  linkedinUrl={startup.linkedin_url}
                />
              </div>
              <div className="detail-item">
                <strong>Created</strong>
                <span>{new Date(startup.created_at).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <strong>Created by</strong>
                <span>{creatorLabel}</span>
              </div>
            </div>

            {startup.notes ? (
              <div className="detail-panel">
                <strong>Notes</strong>
                <p>{startup.notes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Assignments</h2>
            <p>{isLoading ? "Loading assignments..." : `${assignments.length} assignment records`}</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsAssignmentModalOpen(true)}
          >
            New assignment
          </button>
        </div>

        <div className="records-list">
          {!isLoading && assignments.length === 0 ? (
            <div className="empty-state">No assignments created yet for this startup.</div>
          ) : null}

          {assignments.map((assignment) => (
            <article key={assignment.id} className="record-card">
              <div className="record-topline">
                <Link href={`/admin/profiles/${assignment.profile_id}`} className="record-title-link">
                  {profileNameById[assignment.profile_id] ?? "Unknown profile"}
                </Link>
                <span className={getStatusBadgeClass(assignment.status)}>{assignment.status}</span>
              </div>
              <div className="record-meta">
                <span>
                  {assignment.due_date
                    ? `Due ${new Date(assignment.due_date).toLocaleDateString()}`
                    : "No due date"}
                </span>
                <span>
                  {assignment.submitted_at
                    ? `Submitted ${new Date(assignment.submitted_at).toLocaleDateString()}`
                    : "Not submitted"}
                </span>
                <span>{assignment.score !== null ? `Score ${assignment.score}` : "No score"}</span>
                {isAssignmentOverdue(assignment) ? (
                  <span className="status-badge status-badge-overdue">overdue</span>
                ) : null}
              </div>
              {assignment.recommendation ? <p>{assignment.recommendation}</p> : null}
              <div className="record-actions">
                <button
                  type="button"
                  className="secondary-button inline-button"
                  onClick={() => handleEditAssignment(assignment)}
                >
                  Edit assignment
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Startup members</h2>
            <p>Founders and cofounders linked to this startup.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsRelationModalOpen(true)}
          >
            Add relation
          </button>
        </div>

        <div className="profile-placeholder-grid">
          {startupMemberProfiles.length === 0 ? (
            <div className="empty-state">No startup members linked yet.</div>
          ) : (
            startupMemberProfiles.map((member) => (
              <article key={member.id} className="profile-placeholder-card">
                <div className="profile-placeholder-header">
                  {member.profile ? (
                    <Link href={`/admin/profiles/${member.profile.id}`} className="record-title-link">
                      {`${member.profile.first_name} ${member.profile.last_name}`.trim()}
                    </Link>
                  ) : (
                    <strong>Unknown profile</strong>
                  )}
                  <span className="member-role-badge">
                    {member.relationship_type === "cofounder" ? "Co-founder" : "Founder"}
                  </span>
                </div>
                <span className="table-subtext">{member.profile?.email ?? "No email"}</span>
                {member.notes ? <p className="profile-placeholder-note">{member.notes}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Other related profiles</h2>
            <p>Founders, mentors, coaches, evaluators, and any other related people.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsRelationModalOpen(true)}
          >
            Add relation
          </button>
        </div>

        <div className="records-list">
          {!isLoading && relatedProfiles.length === 0 ? (
            <div className="empty-state">No related profiles linked yet.</div>
          ) : null}

          {relatedProfiles.map((member) => (
            <article key={member.id} className="record-card">
              <div className="record-topline">
                {member.profile ? (
                  <Link href={`/admin/profiles/${member.profile.id}`} className="record-title-link">
                    {`${member.profile.first_name} ${member.profile.last_name}`.trim()}
                  </Link>
                ) : (
                  <h3>Unknown profile</h3>
                )}
                <span className="pill">{member.relationship_type}</span>
              </div>

              <div className="record-meta">
                <span>{member.profile?.email ?? "No email"}</span>
                <span>Linked on {new Date(member.created_at).toLocaleDateString()}</span>
              </div>

              {member.notes ? <p>{member.notes}</p> : null}

              <div className="record-actions">
                <button
                  type="button"
                  className="secondary-button inline-button"
                  onClick={() => handleArchiveMember(member.id)}
                  disabled={removingMemberId === member.id}
                >
                  {removingMemberId === member.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isAssignmentModalOpen ? (
        <div className="modal-backdrop" onClick={handleCloseAssignmentModal}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{editingAssignmentId ? "Edit assignment" : "New assignment"}</h2>
                <p>Create or update an assignment for this startup.</p>
              </div>
              <button type="button" className="secondary-button" onClick={handleCloseAssignmentModal}>
                Close
              </button>
            </div>

            <AssignmentForm
              startups={startup ? [startup] : []}
              profiles={profiles}
              initialValues={assignmentFormValues}
              onSubmit={handleAssignmentSubmit}
              submitLabel={editingAssignmentId ? "Save assignment" : "Create assignment"}
              submittingLabel={isAssignmentSubmitting ? "Saving assignment..." : "Saving assignment..."}
              title=""
              description=""
              lockedStartupId={startupId}
            />
          </div>
        </div>
      ) : null}

      {isRelationModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsRelationModalOpen(false)}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Add relation</h2>
                <p>Link an existing profile to this startup.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsRelationModalOpen(false)}
              >
                Close
              </button>
            </div>

            {availableProfiles.length === 0 ? (
              <div className="empty-state">
                All active profiles are already linked, or there are no profiles yet.
              </div>
            ) : (
              <form className="resource-form" onSubmit={handleAddMember}>
                <div className="form-two-columns">
                  <label className="field">
                    <span>Profile</span>
                    <select
                      value={memberForm.profile_id}
                      onChange={(event) =>
                        setMemberForm((current) => ({ ...current, profile_id: event.target.value }))
                      }
                      required
                    >
                      <option value="">{isLoading ? "Loading profiles..." : "Select a profile"}</option>
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {`${profile.first_name} ${profile.last_name}`.trim()}
                          {profile.email ? ` · ${profile.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Relationship type</span>
                    <select
                      value={memberForm.relationship_type}
                      onChange={(event) =>
                        setMemberForm((current) => ({
                          ...current,
                          relationship_type: event.target.value,
                        }))
                      }
                    >
                      {startupMemberRelationshipOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Notes</span>
                  <textarea
                    rows={4}
                    value={memberForm.notes}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Internal context about this relationship."
                  />
                </label>

                <button
                  type="submit"
                  className="login-button auth-submit"
                  disabled={isSubmitting || !memberForm.profile_id}
                >
                  {isSubmitting ? "Linking profile..." : "Add relation"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
