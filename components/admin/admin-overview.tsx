"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deriveStartupEvaluationStatus, fetchAssignments, isAssignmentOverdue } from "@/lib/supabase/assignments";
import { fetchActiveStartups } from "@/lib/supabase/startups";
import { fetchActiveProfiles } from "@/lib/supabase/profiles";
import type { AssignmentRecord, ProfileRecord, StartupRecord } from "@/components/admin/types";

type StartupDashboardRow = {
  startup: StartupRecord;
  evaluationStatus: string;
  evaluatorCount: number;
  submittedCount: number;
  pendingCount: number;
  overdueCount: number;
  assignedProfiles: Array<{
    id: string;
    name: string;
  }>;
};

const summaryCardLabels = [
  { key: "totalStartups", label: "Total startups" },
  { key: "eligibilityPassed", label: "Eligibility passed" },
  { key: "startupsAssigned", label: "Startups with evaluations assigned" },
  { key: "inProgressEvaluations", label: "In progress evaluations" },
  { key: "completedEvaluations", label: "Completed evaluations" },
  { key: "overdueEvaluations", label: "Overdue evaluations" },
] as const;

export function AdminOverview() {
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [startupRows, assignmentRows, profileRows] = await Promise.all([
          fetchActiveStartups(),
          fetchAssignments(),
          fetchActiveProfiles(),
        ]);

        setStartups(startupRows);
        setAssignments(assignmentRows);
        setProfiles(profileRows);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the dashboard right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const profileNameById = useMemo(() => {
    return profiles.reduce<Record<string, string>>((accumulator, profile) => {
      accumulator[profile.id] = `${profile.first_name} ${profile.last_name}`.trim();
      return accumulator;
    }, {});
  }, [profiles]);

  const startupRows = useMemo<StartupDashboardRow[]>(() => {
    return startups.map((startup) => {
      const startupAssignments = assignments.filter(
        (assignment) =>
          assignment.startup_id === startup.id && assignment.assignment_type === "evaluation",
      );

      const submittedCount = startupAssignments.filter(
        (assignment) => assignment.status === "submitted",
      ).length;
      const overdueAssignments = startupAssignments.filter(isAssignmentOverdue);
      const assignedProfiles = startupAssignments
        .map((assignment) => ({
          id: assignment.profile_id,
          name: profileNameById[assignment.profile_id] ?? "Unknown profile",
        }))
        .filter(
          (value, index, array) =>
            array.findIndex((candidate) => candidate.id === value.id) === index,
        );

      return {
        startup,
        evaluationStatus: deriveStartupEvaluationStatus(startupAssignments),
        evaluatorCount: startupAssignments.length,
        submittedCount,
        pendingCount: startupAssignments.length - submittedCount,
        overdueCount: overdueAssignments.length,
        assignedProfiles,
      };
    });
  }, [assignments, profileNameById, startups]);

  const summary = useMemo(() => {
    const evaluations = assignments.filter((assignment) => assignment.assignment_type === "evaluation");

    return {
      totalStartups: startups.length,
      eligibilityPassed: startups.filter((startup) => startup.eligibility_status === "passed").length,
      startupsAssigned: startupRows.filter((row) => row.evaluatorCount > 0).length,
      inProgressEvaluations: evaluations.filter((assignment) => assignment.status === "in_progress").length,
      completedEvaluations: evaluations.filter((assignment) => assignment.status === "submitted").length,
      overdueEvaluations: evaluations.filter(isAssignmentOverdue).length,
    };
  }, [assignments, startupRows, startups]);

  return (
    <div className="page-stack">
      <section className="workspace-grid workspace-grid-overview">
        {summaryCardLabels.map((card) => (
          <article key={card.key} className="workspace-card summary-card">
            <span className="summary-label">{card.label}</span>
            <strong className="summary-value">
              {isLoading ? "..." : summary[card.key]}
            </strong>
          </article>
        ))}
      </section>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Startup follow up</h2>
            <p>
              Review startup evaluation progress, follow up on pending work, and open each record quickly.
            </p>
          </div>
          <div className="record-actions">
            <Link href="/admin/startups" className="secondary-button">
              View startups
            </Link>
            <Link href="/admin/assignments" className="secondary-button">
              View assignments
            </Link>
          </div>
        </div>

        {!isLoading && startupRows.length === 0 ? (
          <div className="empty-state">No startups available yet.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Startup</th>
                  <th>Eligibility</th>
                  <th>Evaluation</th>
                  <th>Assigned</th>
                  <th>Submitted</th>
                  <th>Pending</th>
                  <th>Overdue</th>
                  <th>Cohort</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {startupRows.map((row) => (
                  <tr key={row.startup.id}>
                    <td>
                      <div className="table-primary-cell">
                        <Link href={`/admin/startups/${row.startup.id}`} className="record-title-link">
                          {row.startup.name}
                        </Link>
                        <span className="table-subtext table-link-row">
                          {row.assignedProfiles.length > 0
                            ? row.assignedProfiles.map((profile, index) => (
                                <span key={profile.id}>
                                  {index > 0 ? ", " : ""}
                                  <Link href={`/admin/profiles/${profile.id}`} className="relation-link">
                                    {profile.name}
                                  </Link>
                                </span>
                              ))
                            : "No evaluators assigned yet"}
                        </span>
                      </div>
                    </td>
                    <td>{row.startup.eligibility_status}</td>
                    <td>
                      <span className="pill">{row.evaluationStatus}</span>
                    </td>
                    <td>{row.evaluatorCount}</td>
                    <td>{row.submittedCount}</td>
                    <td>{row.pendingCount}</td>
                    <td>{row.overdueCount}</td>
                    <td>{row.startup.cohort ?? "No cohort"}</td>
                    <td>
                      <Link
                        href={`/admin/startups/${row.startup.id}`}
                        className="secondary-button table-action-button"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
