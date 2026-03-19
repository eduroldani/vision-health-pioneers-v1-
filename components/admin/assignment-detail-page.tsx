"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAssignmentById, fetchAssignmentDependencies } from "@/lib/supabase/assignments";
import { AssignmentRecord, ProfileRecord, StartupRecord } from "@/components/admin/types";

type AssignmentDetailPageProps = {
  assignmentId: string;
};

export function AssignmentDetailPage({ assignmentId }: AssignmentDetailPageProps) {
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadAssignment() {
      try {
        const [assignmentData, dependencyData] = await Promise.all([
          fetchAssignmentById(assignmentId),
          fetchAssignmentDependencies(),
        ]);

        setAssignment(assignmentData);
        setProfiles(dependencyData.profiles);
        setStartups(dependencyData.startups);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the assignment.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssignment();
  }, [assignmentId]);

  return (
    <section className="workspace-card page-card">
      <div className="card-heading page-heading">
        <div>
          <h2>{isLoading ? "Loading assignment..." : "Assignment detail"}</h2>
          <p>Review the evaluation assignment and jump to the related records.</p>
        </div>
        <div className="record-actions">
          <Link href="/admin/assignments" className="secondary-button">
            Back to assignments
          </Link>
          {assignment ? (
            <Link href="/admin/assignments?new=1" className="secondary-button">
              New assignment
            </Link>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      {assignment ? (
        <div className="detail-stack">
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Startup</strong>
              <Link href={`/admin/startups/${assignment.startup_id}`} className="relation-link">
                {startupNameById[assignment.startup_id] ?? "Unknown startup"}
              </Link>
            </div>
            <div className="detail-item">
              <strong>Profile</strong>
              <Link href={`/admin/profiles/${assignment.profile_id}`} className="relation-link">
                {profileNameById[assignment.profile_id] ?? "Unknown profile"}
              </Link>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <strong>Status</strong>
              <span className="pill">{assignment.status}</span>
            </div>
            <div className="detail-item">
              <strong>Assignment type</strong>
              <span>{assignment.assignment_type}</span>
            </div>
            <div className="detail-item">
              <strong>Due date</strong>
              <span>
                {assignment.due_date
                  ? new Date(assignment.due_date).toLocaleString()
                  : "Not set"}
              </span>
            </div>
            <div className="detail-item">
              <strong>Submitted at</strong>
              <span>
                {assignment.submitted_at
                  ? new Date(assignment.submitted_at).toLocaleString()
                  : "Not submitted"}
              </span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <strong>Score</strong>
              <span>{assignment.score ?? "No score"}</span>
            </div>
            <div className="detail-item">
              <strong>Recommendation</strong>
              <span>{assignment.recommendation ?? "No recommendation"}</span>
            </div>
          </div>

          {assignment.notes ? (
            <div className="detail-panel">
              <strong>Notes</strong>
              <p>{assignment.notes}</p>
            </div>
          ) : null}

          {assignment.form_url ? (
            <div className="detail-panel">
              <strong>Form URL</strong>
              <a href={assignment.form_url} target="_blank" rel="noreferrer" className="inline-link">
                Open form
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
