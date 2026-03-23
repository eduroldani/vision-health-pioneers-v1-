"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParentCoachingForm } from "@/components/admin/parent-coaching-form";
import type {
  CoachingTagRecord,
  CohortCoachingSessionRecord,
  CohortRecord,
  ParentCoachingTaskRecord,
  ProfileDetailRecord,
  ProfileRecord,
  StartupRecord,
} from "@/components/admin/types";
import { cohortCoachingSessionTypeOptions, parentCoachingTaskStatusOptions } from "@/components/admin/types";
import {
  createCohortCoachingSession,
  defaultCohortCoachingSessionFormValues,
  defaultParentCoachingFormValues,
  deleteCohortCoachingSession,
  fetchParentCoachingById,
  getParentCoachingFormValues,
  updateCohortCoachingSession,
  updateParentCoaching,
  updateParentCoachingTasks,
} from "@/lib/supabase/program-management";

type ParentCoachingEditPageProps = {
  parentCoachingId: string;
};

export function ParentCoachingEditPage({ parentCoachingId }: ParentCoachingEditPageProps) {
  const router = useRouter();
  const [values, setValues] = useState(defaultParentCoachingFormValues);
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [coachingTags, setCoachingTags] = useState<CoachingTagRecord[]>([]);
  const [coachProfiles, setCoachProfiles] = useState<ProfileRecord[]>([]);
  const [teamMemberProfiles, setTeamMemberProfiles] = useState<ProfileRecord[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetailRecord[]>([]);
  const [tasks, setTasks] = useState<ParentCoachingTaskRecord[]>([]);
  const [sessions, setSessions] = useState<CohortCoachingSessionRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [sessionValues, setSessionValues] = useState(defaultCohortCoachingSessionFormValues);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [taskAutosaveState, setTaskAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastSavedTasksRef = useRef("");
  const hasLoadedTasksRef = useRef(false);

  const startupNameById = useMemo(
    () =>
      startups.reduce<Record<string, string>>((accumulator, startup) => {
        accumulator[startup.id] = startup.name;
        return accumulator;
      }, {}),
    [startups],
  );
  const selectedCoach = useMemo(
    () => coachProfiles.find((profile) => profile.id === values.coach_profile_id) ?? null,
    [coachProfiles, values.coach_profile_id],
  );
  const selectedCoachDetail = useMemo(
    () => profileDetails.find((detail) => detail.profile_id === values.coach_profile_id) ?? null,
    [profileDetails, values.coach_profile_id],
  );
  const coachMissingItems = useMemo(() => getCoachMissingItems(selectedCoachDetail), [selectedCoachDetail]);
  const teamMemberNameById = useMemo(
    () =>
      teamMemberProfiles.reduce<Record<string, string>>((accumulator, profile) => {
        accumulator[profile.id] = `${profile.first_name} ${profile.last_name}`;
        return accumulator;
      }, {}),
    [teamMemberProfiles],
  );
  const distributedHours = useMemo(
    () => sessions.reduce((sum, session) => sum + (session.planned_duration_hours ?? 0), 0),
    [sessions],
  );
  const executedHours = useMemo(
    () =>
      sessions.reduce(
        (sum, session) => sum + (session.status === "done" ? (session.planned_duration_hours ?? 0) : 0),
        0,
      ),
    [sessions],
  );
  const serializedTasks = useMemo(() => serializeTasks(tasks), [tasks]);

  useEffect(() => {
    void loadParentCoaching();
  }, [parentCoachingId]);

  useEffect(() => {
    if (isLoading || !hasLoadedTasksRef.current) {
      return;
    }

    if (serializedTasks === lastSavedTasksRef.current) {
      return;
    }

    setTaskAutosaveState("saving");

    const timeoutId = window.setTimeout(() => {
      void persistTasks(tasks);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, serializedTasks, tasks]);

  async function loadParentCoaching() {
    try {
      const data = await fetchParentCoachingById(parentCoachingId);
      setValues(getParentCoachingFormValues(data.parentCoaching));
      setCohorts(data.cohorts);
      setCoachingTags(data.coachingTags);
      setCoachProfiles(data.coachProfiles);
      setTeamMemberProfiles(data.teamMemberProfiles);
      setProfileDetails(data.profileDetails);
      setTasks(data.parentCoachingTasks);
      lastSavedTasksRef.current = serializeTasks(data.parentCoachingTasks);
      hasLoadedTasksRef.current = true;
      setTaskAutosaveState("idle");
      setSessions(data.parentCoachingSessions);
      setStartups(data.startups);
      setSessionValues((current) => ({
        ...current,
        startup_id: current.startup_id || data.startups[0]?.id || "",
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load coach session.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (serializedTasks !== lastSavedTasksRef.current) {
        await persistTasks(tasks);
      }
      await updateParentCoaching(parentCoachingId, {
        ...values,
        hours_executed: executedHours.toString(),
        actual_amount:
          values.hourly_rate && executedHours > 0 ? (Number(values.hourly_rate) * executedHours).toFixed(2) : values.actual_amount,
      });
      router.push("/admin/program-management/parent-coachings");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update coach session.");
    } finally {
      setIsSaving(false);
    }
  }

  async function persistTasks(nextTasks: ParentCoachingTaskRecord[]) {
    try {
      await updateParentCoachingTasks(nextTasks);
      lastSavedTasksRef.current = serializeTasks(nextTasks);
      setTaskAutosaveState("saved");
    } catch (error) {
      setTaskAutosaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save checklist changes.");
      throw error;
    }
  }

  async function handleSaveSession() {
    setIsSavingSession(true);
    setErrorMessage(null);

    try {
      if (editingSessionId) {
        await updateCohortCoachingSession(editingSessionId, sessionValues);
      } else {
        await createCohortCoachingSession(parentCoachingId, sessionValues);
      }

      setIsSessionModalOpen(false);
      setEditingSessionId(null);
      setSessionValues((current) => ({ ...defaultCohortCoachingSessionFormValues, startup_id: current.startup_id }));
      await loadParentCoaching();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save sub-session.");
    } finally {
      setIsSavingSession(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("Delete this sub-session?")) {
      return;
    }

    try {
      await deleteCohortCoachingSession(sessionId);
      await loadParentCoaching();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete sub-session.");
    }
  }

  function openCreateSessionModal() {
    setEditingSessionId(null);
    setSessionValues({
      ...defaultCohortCoachingSessionFormValues,
      hourly_rate: values.hourly_rate || "124.5",
      startup_id: startups[0]?.id || "",
    });
    setIsSessionModalOpen(true);
  }

  function openEditSessionModal(session: CohortCoachingSessionRecord) {
    setEditingSessionId(session.id);
    setSessionValues({
      title: session.title,
      startup_id: session.startup_id ?? "",
      session_type: session.session_type,
      hourly_rate: session.hourly_rate?.toString() ?? values.hourly_rate ?? "124.5",
      planned_date: session.planned_date ?? "",
      planned_duration_hours: session.planned_duration_hours?.toString() ?? "",
      status: session.status,
      notes: session.notes ?? "",
    });
    setIsSessionModalOpen(true);
  }

  if (isLoading) {
    return (
      <section className="workspace-card page-card">
        <div className="card-heading">
          <h2>Loading coach session</h2>
          <p>Preparing the coach session record.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="card-heading">
          <h2>Edit coach session</h2>
          <p>Manage the coach, planning, requirements, delivery, and sub-sessions from one place.</p>
        </div>
        <Link href="/admin/program-management/parent-coachings" className="secondary-button">
          Back to coach sessions
        </Link>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <div className="program-edit-shell">
        <div className="program-edit-main">
          <ParentCoachingForm
            title="Coach session details"
            description="This session is the core operational record that connects the coach, planning, rate, hours, and delivery mix."
            values={values}
            cohorts={cohorts}
            coachingTags={coachingTags}
            coachProfiles={coachProfiles}
            onChange={setValues}
            onSubmit={handleSubmit}
            submitLabel="Save coach session"
            isSaving={isSaving}
            distributedHours={distributedHours}
            executedHours={executedHours}
          />

          <section className="workspace-card page-card">
            <div className="card-heading">
              <div>
                <h2>Checklist tasks</h2>
                <p>Keep these steps lightweight and clear so you always know what is still pending before delivery.</p>
              </div>
              <span className={`autosave-indicator autosave-indicator-${taskAutosaveState}`}>
                {taskAutosaveState === "saving"
                  ? "Saving checklist..."
                  : taskAutosaveState === "saved"
                    ? "Checklist saved"
                    : taskAutosaveState === "error"
                      ? "Checklist save failed"
                      : "Autosave on"}
              </span>
            </div>

            <div className="checklist-task-list">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className={`checklist-task-card checklist-task-${task.status.replaceAll("_", "-")}`}
                >
                  <div className="checklist-task-head">
                    <div className="checklist-task-title">
                      <strong>{task.title}</strong>
                      {task.description ? <span>{task.description}</span> : null}
                    </div>
                    <div className="checklist-task-badges">
                      <span className={`status-badge status-badge-${task.status.replaceAll("_", "-")}`}>
                        {formatStatusLabel(task.status)}
                      </span>
                      <span className="pill">{task.is_required ? "Required" : "Optional"}</span>
                    </div>
                  </div>

                  <div className="checklist-task-controls">
                    <label className="field checklist-task-field">
                      <span>State</span>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((currentTask) =>
                              currentTask.id === task.id
                                ? {
                                    ...currentTask,
                                    status: event.target.value,
                                    completed_at:
                                      event.target.value === "done"
                                        ? currentTask.completed_at ?? new Date().toISOString()
                                        : event.target.value === "skipped"
                                          ? null
                                          : currentTask.completed_at,
                                  }
                                : currentTask,
                            ),
                          )
                        }
                      >
                        {parentCoachingTaskStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatStatusLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field checklist-task-field">
                      <span>Responsible</span>
                      <select
                        value={task.responsible_person ?? ""}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((currentTask) =>
                              currentTask.id === task.id
                                ? { ...currentTask, responsible_person: event.target.value || null }
                                : currentTask,
                            ),
                          )
                        }
                      >
                        <option value="">No responsible person</option>
                        {teamMemberProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.first_name} {profile.last_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field checklist-task-field">
                      <span>Due date</span>
                      <input
                        type="date"
                        value={task.due_date ?? ""}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((currentTask) =>
                              currentTask.id === task.id
                                ? { ...currentTask, due_date: event.target.value || null }
                                : currentTask,
                            ),
                          )
                        }
                      />
                    </label>

                    <label className="field checklist-task-note">
                      <span>Note</span>
                      <textarea
                        rows={1}
                        value={task.notes ?? ""}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((currentTask) =>
                              currentTask.id === task.id
                                ? { ...currentTask, notes: event.target.value || null }
                                : currentTask,
                            ),
                          )
                        }
                        placeholder="Optional note or handoff detail"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="program-edit-side">
          <section className="workspace-card page-card">
            <div className="card-heading">
              <div>
                <h2>Coach profile</h2>
                <p>Relevant coach information stays visible while you plan and edit the session.</p>
              </div>
            </div>

            {selectedCoach ? (
              <div className="coach-profile-preview">
                <div className="coach-profile-preview-header">
                  <div className="profile-avatar profile-avatar-large">
                    {getInitials(selectedCoach.first_name, selectedCoach.last_name)}
                  </div>
                  <div className="coach-profile-preview-copy">
                    <strong>
                      {selectedCoach.first_name} {selectedCoach.last_name}
                    </strong>
                    <span>{selectedCoach.email}</span>
                    <div className="pill-row">
                      <span className={`status-badge status-badge-${values.onboarding_status.replaceAll("_", "-")}`}>
                        {formatStatusLabel(values.onboarding_status)}
                      </span>
                      <span className="pill">
                        {selectedCoachDetail?.internal_code ?? "No internal code"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-grid detail-grid-compact">
                  <div className="detail-item">
                    <strong>Agreement status</strong>
                    <span>
                      {selectedCoachDetail?.agreement_status
                        ? formatStatusLabel(selectedCoachDetail.agreement_status)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Agreement valid until</strong>
                    <span>{selectedCoachDetail?.agreement_end_date ?? "Not set"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Profile status</strong>
                    <span>
                      {selectedCoachDetail?.profile_status
                        ? formatStatusLabel(selectedCoachDetail.profile_status)
                        : "Not set"}
                    </span>
                  </div>
                  <div className={`detail-item ${selectedCoachDetail?.drive_url ? "" : "detail-item-missing"}`}>
                    <strong>Google Drive Profile URL</strong>
                    <span>{selectedCoachDetail?.drive_url ? "Linked" : "Missing"}</span>
                  </div>
                </div>

                <div className="coach-profile-preview-links">
                  {selectedCoach.linkedin_url ? (
                    <Link href={selectedCoach.linkedin_url} target="_blank" rel="noreferrer" className="secondary-button">
                      LinkedIn
                    </Link>
                  ) : null}
                  {selectedCoach.website_url ? (
                    <Link href={selectedCoach.website_url} target="_blank" rel="noreferrer" className="secondary-button">
                      Website
                    </Link>
                  ) : null}
                  <Link href={`/admin/profiles/${selectedCoach.id}`} className="secondary-button">
                    Open profile
                  </Link>
                </div>

                {coachMissingItems.length > 0 ? (
                  <div className="detail-warning-grid">
                    {coachMissingItems.map((item) => (
                      <div key={item} className="detail-warning-item">
                        <strong>Missing</strong>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="detail-panel">
                    <strong>Ready to review</strong>
                    <p>This coach profile has the main operational details in place for session planning.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-panel coach-profile-preview-empty">
                <strong>Select a coach</strong>
                <p>The related coach profile information will appear here in the side column.</p>
              </div>
            )}
          </section>
        </aside>
      </div>

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Sub-sessions</h2>
            <p>Track the actual delivery inside this coach session, including workshops, 1:1s, meetups, and other events.</p>
          </div>
          <button type="button" className="login-button admin-button" onClick={openCreateSessionModal}>
            Add sub-session
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">No sub-sessions added yet.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sub-session</th>
                  <th>Linked to</th>
                  <th>Type</th>
                  <th>Rate</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.title}</td>
                    <td>{describeSessionAudience(session, values.cohort_id, startupNameById, cohorts)}</td>
                    <td>{formatStatusLabel(session.session_type)}</td>
                    <td>{session.hourly_rate !== null ? `EUR ${session.hourly_rate}` : "—"}</td>
                    <td>{session.planned_date ?? "—"}</td>
                    <td>{formatStatusLabel(session.status)}</td>
                    <td>
                      <div className="record-actions">
                        <button type="button" className="secondary-button" onClick={() => openEditSessionModal(session)}>
                          Edit
                        </button>
                        <button type="button" className="secondary-button" onClick={() => void handleDeleteSession(session.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isSessionModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSessionModalOpen(false)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{editingSessionId ? "Edit sub-session" : "Add sub-session"}</h2>
                <p>Link the delivery to the startup and the exact date it is happening.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsSessionModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="resource-form">
              <label className="field">
                <span>Sub-session name</span>
                <input
                  value={sessionValues.title}
                  onChange={(event) => setSessionValues((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Workshop with Cohort 8"
                />
              </label>

              <label className="field">
                <span>Type</span>
                <select
                  value={sessionValues.session_type}
                  onChange={(event) =>
                    setSessionValues((current) => ({
                      ...current,
                      session_type: event.target.value,
                      startup_id: event.target.value === "one_to_one" ? current.startup_id : "",
                    }))
                  }
                >
                  {cohortCoachingSessionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              {sessionValues.session_type === "one_to_one" ? (
                <label className="field">
                  <span>Startup</span>
                  <select
                    value={sessionValues.startup_id}
                    onChange={(event) => setSessionValues((current) => ({ ...current, startup_id: event.target.value }))}
                  >
                    <option value="">Select startup</option>
                    {startups.map((startup) => (
                      <option key={startup.id} value={startup.id}>
                        {startup.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="detail-panel">
                  <strong>Linked audience</strong>
                  <p>
                    This {formatStatusLabel(sessionValues.session_type)} will be linked to{" "}
                    {cohorts.find((cohort) => cohort.id === values.cohort_id)?.name ?? "the selected cohort"}.
                  </p>
                </div>
              )}

              <label className="field">
                <span>Rate</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sessionValues.hourly_rate}
                  onChange={(event) => setSessionValues((current) => ({ ...current, hourly_rate: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={sessionValues.planned_date}
                  onChange={(event) => setSessionValues((current) => ({ ...current, planned_date: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Hours</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={sessionValues.planned_duration_hours}
                  onChange={(event) => setSessionValues((current) => ({ ...current, planned_duration_hours: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={sessionValues.status}
                  onChange={(event) => setSessionValues((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="planned">Planned</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={sessionValues.notes}
                  onChange={(event) => setSessionValues((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="login-button form-action-button" onClick={() => void handleSaveSession()} disabled={isSavingSession}>
                  {isSavingSession ? "Saving..." : editingSessionId ? "Save sub-session" : "Add sub-session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function serializeTasks(tasks: ParentCoachingTaskRecord[]) {
  return JSON.stringify(
    tasks.map((task) => ({
      id: task.id,
      status: task.status,
      responsible_person: task.responsible_person,
      due_date: task.due_date,
      completed_at: task.completed_at,
      notes: task.notes,
    })),
  );
}

function describeSessionAudience(
  session: CohortCoachingSessionRecord,
  cohortId: string,
  startupNameById: Record<string, string>,
  cohorts: CohortRecord[],
) {
  if (session.session_type === "one_to_one") {
    return session.startup_id ? startupNameById[session.startup_id] ?? "Unknown startup" : "Startup missing";
  }

  return cohorts.find((cohort) => cohort.id === cohortId)?.name ?? "Selected cohort";
}

function getCoachMissingItems(detail: ProfileDetailRecord | null) {
  const missing: string[] = [];

  if (!detail?.profile_status) {
    missing.push("Profile status");
  }
  if (!detail?.agreement_status) {
    missing.push("Agreement status");
  }
  if (!detail?.agreement_end_date) {
    missing.push("Agreement end date");
  }
  if (!detail?.drive_url) {
    missing.push("Google Drive Profile URL");
  }

  return missing;
}
