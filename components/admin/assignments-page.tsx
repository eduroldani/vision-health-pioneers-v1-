"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createAssignment,
  defaultAssignmentFormValues,
  fetchAssignmentDependencies,
  fetchAssignments,
  getAssignmentFormValues,
  isAssignmentOverdue,
  updateAssignment,
  type AssignmentFormValues,
} from "@/lib/supabase/assignments";
import { AssignmentForm } from "@/components/admin/assignment-form";
import {
  AssignmentRecord,
  ProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

export function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [formValues, setFormValues] = useState<AssignmentFormValues>(defaultAssignmentFormValues);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  async function loadPageData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [dependencyData, assignmentData] = await Promise.all([
        fetchAssignmentDependencies(),
        fetchAssignments(),
      ]);

      setStartups(dependencyData.startups);
      setProfiles(dependencyData.profiles);
      setAssignments(assignmentData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load assignments right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingAssignmentId(null);
      setFormValues(defaultAssignmentFormValues);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  async function handleSubmit(values: AssignmentFormValues) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingAssignmentId) {
        await updateAssignment(editingAssignmentId, values);
      } else {
        await createAssignment(values);
      }

      await loadPageData();
      setFormValues(defaultAssignmentFormValues);
      setEditingAssignmentId(null);
      setIsModalOpen(false);
      setSuccessMessage(
        editingAssignmentId ? "Assignment updated successfully." : "Assignment created successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the assignment right now.",
      );
      throw error;
    }
  }

  function handleEdit(record: AssignmentRecord) {
    setEditingAssignmentId(record.id);
    setFormValues(getAssignmentFormValues(record));
    setIsModalOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleCloseModal() {
    setEditingAssignmentId(null);
    setFormValues(defaultAssignmentFormValues);
    setIsModalOpen(false);
    if (searchParams.get("new") === "1") {
      router.replace("/admin/assignments");
    }
  }

  return (
    <div className="page-stack">
      {successMessage ? <p className="form-message form-message-success">{successMessage}</p> : null}
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Assignments</h2>
            <p>Clear follow up for evaluations only.</p>
          </div>
          <div className="record-actions">
            <button
              type="button"
              className="login-button admin-button"
              onClick={() => setIsModalOpen(true)}
            >
              New assignment
            </button>
          </div>
        </div>

        <div className="record-subsection">
          <strong>Follow up</strong>
          <span>
            {isLoading
              ? "Loading assignments..."
              : `${assignments.length} assignments · ${assignments.filter(isAssignmentOverdue).length} overdue`}
          </span>
        </div>

        <div className="records-list">
          {!isLoading && assignments.length === 0 ? (
            <div className="empty-state">No assignments created yet.</div>
          ) : null}

          {assignments.map((assignment) => (
            <article key={assignment.id} className="record-card">
              <div className="assignment-line">
                <span className="assignment-prefix">Evaluation from</span>
                <Link href={`/admin/profiles/${assignment.profile_id}`} className="relation-link">
                  {profileNameById[assignment.profile_id] ?? "Unknown profile"}
                </Link>
                <span className="assignment-prefix">to</span>
                <Link href={`/admin/startups/${assignment.startup_id}`} className="relation-link">
                  {startupNameById[assignment.startup_id] ?? "Unknown startup"}
                </Link>
              </div>

              <div className="record-meta">
                <span>
                  Due date:{" "}
                  {assignment.due_date
                    ? new Date(assignment.due_date).toLocaleDateString()
                    : "Not set"}
                </span>
                <span className="pill">{assignment.status}</span>
                {isAssignmentOverdue(assignment) ? (
                  <span className="status-badge status-badge-overdue">overdue</span>
                ) : null}
              </div>

              <div className="record-actions">
                <button
                  type="button"
                  className="secondary-button inline-button"
                  onClick={() => handleEdit(assignment)}
                >
                  Edit assignment
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{editingAssignmentId ? "Edit assignment" : "New assignment"}</h2>
                <p>Create or update one evaluation assignment.</p>
              </div>
              <button type="button" className="secondary-button" onClick={handleCloseModal}>
                Close
              </button>
            </div>

            <AssignmentForm
              startups={startups}
              profiles={profiles}
              initialValues={formValues}
              onSubmit={handleSubmit}
              submitLabel={editingAssignmentId ? "Save assignment" : "Create assignment"}
              submittingLabel="Saving assignment..."
              title=""
              description=""
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
