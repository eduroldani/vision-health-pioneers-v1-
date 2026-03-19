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
  const [sortBy, setSortBy] = useState("created_newest");
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

  const sortedAssignments = useMemo(() => {
    const nextAssignments = [...assignments];

    nextAssignments.sort((left, right) => {
      const leftLabel = `${profileNameById[left.profile_id] ?? ""} ${startupNameById[left.startup_id] ?? ""}`.trim();
      const rightLabel = `${profileNameById[right.profile_id] ?? ""} ${startupNameById[right.startup_id] ?? ""}`.trim();

      if (sortBy === "name_asc") {
        return leftLabel.localeCompare(rightLabel);
      }

      if (sortBy === "name_desc") {
        return rightLabel.localeCompare(leftLabel);
      }

      if (sortBy === "created_oldest") {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });

    return nextAssignments;
  }, [assignments, profileNameById, sortBy, startupNameById]);

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
          {!isLoading && sortedAssignments.length === 0 ? (
            <div className="empty-state">No assignments created yet.</div>
          ) : null}

          {sortedAssignments.map((assignment) => (
            <article key={assignment.id} className="record-card">
              <div className="record-topline">
                <div className="assignment-line">
                  <span className="assignment-entity">
                    <span className="assignment-entity-icon" aria-hidden="true">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 2c-3.27 0-6 1.92-6 4.3 0 .39.31.7.7.7h10.6a.7.7 0 0 0 .7-.7C16 13.92 13.27 12 10 12Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <Link href={`/admin/profiles/${assignment.profile_id}`} className="relation-link">
                      {profileNameById[assignment.profile_id] ?? "Unknown profile"}
                    </Link>
                  </span>
                  <span className="assignment-connector" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10h12m-4-4 4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="assignment-entity">
                    <Link href={`/admin/startups/${assignment.startup_id}`} className="relation-link">
                      {startupNameById[assignment.startup_id] ?? "Unknown startup"}
                    </Link>
                  </span>
                </div>
                <span className="assignment-type-badge">
                  {assignment.assignment_type}
                </span>
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
                <Link
                  href={`/admin/assignments/${assignment.id}`}
                  className="secondary-button inline-button"
                >
                  View details
                </Link>
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
