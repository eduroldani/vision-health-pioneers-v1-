"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deriveStartupEvaluationStatus,
  fetchAssignments,
  isAssignmentOverdue,
} from "@/lib/supabase/assignments";
import { fetchActiveStartups, fetchStartupDetailById } from "@/lib/supabase/startups";
import { fetchActiveProfiles } from "@/lib/supabase/profiles";
import type { AssignmentRecord, ProfileRecord, StartupRecord } from "@/components/admin/types";

type StartupDashboardRow = {
  startup: StartupRecord;
  evaluationStatus: string;
  startupMembersCount: number;
  assignmentCount: number;
  overdueCount: number;
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
  const [, setProfiles] = useState<ProfileRecord[]>([]);
  const [startupMembersCountByStartupId, setStartupMembersCountByStartupId] = useState<
    Record<string, number>
  >({});
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

        const startupDetails = await Promise.all(
          startupRows.map(async (startup) => fetchStartupDetailById(startup.id)),
        );

        setStartupMembersCountByStartupId(
          startupDetails.reduce<Record<string, number>>((accumulator, startupDetail) => {
            accumulator[startupDetail.startup.id] = startupDetail.startupMembers.filter(
              (member) =>
                member.relationship_type === "founder" ||
                member.relationship_type === "cofounder",
            ).length;
            return accumulator;
          }, {}),
        );
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

  const startupRows = useMemo<StartupDashboardRow[]>(() => {
    return startups.map((startup) => {
      const startupAssignments = assignments.filter(
        (assignment) =>
          assignment.startup_id === startup.id && assignment.assignment_type === "evaluation",
      );

      return {
        startup,
        evaluationStatus: deriveStartupEvaluationStatus(startupAssignments),
        startupMembersCount: startupMembersCountByStartupId[startup.id] ?? 0,
        assignmentCount: startupAssignments.length,
        overdueCount: startupAssignments.filter(isAssignmentOverdue).length,
      };
    });
  }, [assignments, startupMembersCountByStartupId, startups]);

  const summary = useMemo(() => {
    const evaluations = assignments.filter(
      (assignment) => assignment.assignment_type === "evaluation",
    );

    return {
      totalStartups: startups.length,
      eligibilityPassed: startups.filter((startup) => startup.eligibility_status === "passed")
        .length,
      startupsAssigned: startupRows.filter((row) => row.assignmentCount > 0).length,
      inProgressEvaluations: evaluations.filter((assignment) => assignment.status === "in_progress")
        .length,
      completedEvaluations: evaluations.filter((assignment) => assignment.status === "submitted")
        .length,
      overdueEvaluations: evaluations.filter(isAssignmentOverdue).length,
    };
  }, [assignments, startupRows, startups]);

  return (
    <div className="page-stack">
      <section className="workspace-grid workspace-grid-overview">
        {summaryCardLabels.map((card) => (
          <article key={card.key} className="workspace-card summary-card">
            <span className="summary-label">{card.label}</span>
            <strong className="summary-value">{isLoading ? "..." : summary[card.key]}</strong>
          </article>
        ))}
      </section>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Startup follow up</h2>
            <p>Review startup evaluation progress and open each record quickly.</p>
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
                  <th>Startup name</th>
                  <th>Cohort</th>
                  <th>Program status</th>
                  <th>Eligibility</th>
                  <th>Evaluation</th>
                  <th>Team members number</th>
                  <th>Assignments</th>
                  <th>Overdue assignments</th>
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
                        <span className="table-subtext">Open startup details</span>
                      </div>
                    </td>
                    <td>{row.startup.cohort ?? "No cohort"}</td>
                    <td>
                      <span className={getStatusBadgeClassName(row.startup.program_status)}>
                        {formatStatusLabel(row.startup.program_status)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClassName(row.startup.eligibility_status)}>
                        {formatStatusLabel(row.startup.eligibility_status)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClassName(row.evaluationStatus)}>
                        {formatStatusLabel(row.evaluationStatus)}
                      </span>
                    </td>
                    <td>{row.startupMembersCount}</td>
                    <td>{row.assignmentCount}</td>
                    <td>{row.overdueCount}</td>
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

function getStatusBadgeClassName(value: string) {
  return `status-badge status-badge-${value.replaceAll("_", "-")}`;
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}
