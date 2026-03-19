"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deriveStartupEvaluationStatus,
  fetchAssignments,
  isAssignmentOverdue,
} from "@/lib/supabase/assignments";
import { fetchStartupsOverview } from "@/lib/supabase/startups";
import type {
  AssignmentRecord,
  StartupMemberWithProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

type StartupDashboardRow = {
  startup: StartupRecord;
  evaluationStatus: string;
  startupMembersCount: number;
  foundersCount: number;
  assignmentCount: number;
  overdueCount: number;
};

const summaryCardLabels = [
  { key: "totalStartups", label: "Number of startups" },
  { key: "totalFounders", label: "Number of founders" },
  { key: "founderDistribution", label: "Founder gender distribution" },
  { key: "totalAssignments", label: "Number of assignments" },
  { key: "overdueAssignments", label: "Overdue assignments" },
] as const;

export function AdminOverview() {
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [startupMembers, setStartupMembers] = useState<StartupMemberWithProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [startupOverview, assignmentRows] = await Promise.all([
          fetchStartupsOverview(),
          fetchAssignments(),
        ]);

        setStartups(startupOverview.startups);
        setStartupMembers(startupOverview.startupMembers);
        setAssignments(assignmentRows);
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

  const startupMembersByStartupId = useMemo(() => {
    return startupMembers.reduce<Record<string, StartupMemberWithProfileRecord[]>>(
      (accumulator, member) => {
        const currentMembers = accumulator[member.startup_id] ?? [];
        currentMembers.push(member);
        accumulator[member.startup_id] = currentMembers;
        return accumulator;
      },
      {},
    );
  }, [startupMembers]);

  const startupRows = useMemo<StartupDashboardRow[]>(() => {
    return startups.map((startup) => {
      const startupAssignments = assignments.filter(
        (assignment) =>
          assignment.startup_id === startup.id && assignment.assignment_type === "evaluation",
      );
      const members = startupMembersByStartupId[startup.id] ?? [];
      const founders = members.filter(
        (member) =>
          member.relationship_type === "founder" || member.relationship_type === "cofounder",
      );

      return {
        startup,
        evaluationStatus: deriveStartupEvaluationStatus(startupAssignments),
        startupMembersCount: members.length,
        foundersCount: founders.length,
        assignmentCount: startupAssignments.length,
        overdueCount: startupAssignments.filter(isAssignmentOverdue).length,
      };
    });
  }, [assignments, startupMembersByStartupId, startups]);

  const summary = useMemo(() => {
    const evaluationAssignments = assignments.filter(
      (assignment) => assignment.assignment_type === "evaluation",
    );
    const founderProfileIds = Array.from(
      new Set(
        startupMembers
          .filter(
            (member) =>
              member.relationship_type === "founder" || member.relationship_type === "cofounder",
          )
          .map((member) => member.profile_id),
      ),
    );

    const founders = founderProfileIds
      .map((profileId) =>
        startupMembers.find((member) => member.profile_id === profileId)?.profile ?? null,
      )
      .filter(Boolean);

    return {
      totalStartups: startups.length,
      totalFounders: founders.length,
      femaleFounders: founders.filter((profile) => profile?.gender === "female").length,
      maleFounders: founders.filter((profile) => profile?.gender === "male").length,
      diverseFounders: founders.filter((profile) => profile?.gender === "diverse").length,
      totalAssignments: evaluationAssignments.length,
      overdueAssignments: evaluationAssignments.filter(isAssignmentOverdue).length,
    };
  }, [assignments, startupMembers, startups]);

  const founderDistributionLabel = useMemo(() => {
    const totalFounders = summary.totalFounders;

    if (totalFounders === 0) {
      return "No founders linked yet";
    }

    const femalePercent = Math.round((summary.femaleFounders / totalFounders) * 100);
    const malePercent = Math.round((summary.maleFounders / totalFounders) * 100);

    return `${femalePercent}% female / ${malePercent}% male`;
  }, [summary.femaleFounders, summary.maleFounders, summary.totalFounders]);

  const unsetFounders =
    summary.totalFounders -
    summary.femaleFounders -
    summary.maleFounders -
    summary.diverseFounders;

  const founderDistributionStyle = useMemo(() => {
    const total = summary.totalFounders;

    if (total === 0) {
      return {
        background:
          "conic-gradient(rgba(58, 1, 116, 0.1) 0deg 360deg)",
      };
    }

    const femaleDegrees = (summary.femaleFounders / total) * 360;
    const maleDegrees = (summary.maleFounders / total) * 360;
    const diverseDegrees = (summary.diverseFounders / total) * 360;
    const unsetDegrees = 360 - femaleDegrees - maleDegrees - diverseDegrees;

    return {
      background: `conic-gradient(
        #ef476f 0deg ${femaleDegrees}deg,
        #5365ff ${femaleDegrees}deg ${femaleDegrees + maleDegrees}deg,
        #f59e0b ${femaleDegrees + maleDegrees}deg ${femaleDegrees + maleDegrees + diverseDegrees}deg,
        rgba(58, 1, 116, 0.16) ${femaleDegrees + maleDegrees + diverseDegrees}deg ${femaleDegrees + maleDegrees + diverseDegrees + unsetDegrees}deg
      )`,
    };
  }, [
    summary.diverseFounders,
    summary.femaleFounders,
    summary.maleFounders,
    summary.totalFounders,
  ]);

  const summaryFooters = {
    totalStartups: `${startupRows.filter((row) => row.assignmentCount > 0).length} with assignments`,
    totalFounders: founderDistributionLabel,
    totalAssignments: `${assignments.filter((assignment) => assignment.status === "submitted").length} completed`,
    overdueAssignments: `${assignments.filter((assignment) => assignment.status === "in_progress").length} in progress`,
  };

  return (
    <div className="page-stack">
      <section className="workspace-grid workspace-grid-overview">
        {summaryCardLabels.map((card) => (
          <article key={card.key} className="workspace-card summary-card">
            <span className="summary-label">{card.label}</span>
            {card.key === "founderDistribution" ? (
              !isLoading ? (
                <div className="distribution-card">
                  <div className="distribution-chart" style={founderDistributionStyle}>
                    <div className="distribution-chart-center">{summary.totalFounders}</div>
                  </div>
                  <div className="distribution-legend">
                    <span className="distribution-legend-item">
                      <span className="distribution-dot distribution-dot-female" />
                      Female {summary.femaleFounders}
                    </span>
                    <span className="distribution-legend-item">
                      <span className="distribution-dot distribution-dot-male" />
                      Male {summary.maleFounders}
                    </span>
                    <span className="distribution-legend-item">
                      <span className="distribution-dot distribution-dot-diverse" />
                      Diverse {summary.diverseFounders}
                    </span>
                    <span className="distribution-legend-item">
                      <span className="distribution-dot distribution-dot-unset" />
                      Unset {unsetFounders}
                    </span>
                  </div>
                </div>
              ) : (
                <strong className="summary-value">...</strong>
              )
            ) : (
              <>
                <strong className="summary-value">{isLoading ? "..." : summary[card.key]}</strong>
                {!isLoading ? <span className="summary-meta">{summaryFooters[card.key]}</span> : null}
              </>
            )}
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
                  <th>Team members</th>
                  <th>Founders</th>
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
                    <td>{row.foundersCount}</td>
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
