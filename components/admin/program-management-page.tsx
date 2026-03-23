"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type {
  CohortRecord,
  ParentCoachingWithRelationsRecord,
  StartupRecord,
} from "@/components/admin/types";
import { fetchParentCoachingsOverview, fetchProgramManagementOverview } from "@/lib/supabase/program-management";

export function ProgramManagementPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [parentCoachings, setParentCoachings] = useState<ParentCoachingWithRelationsRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await fetchProgramManagementOverview();
        const parentCoachingData = await fetchParentCoachingsOverview();
        setCohorts(data.cohorts);
        setStartups(data.startups);
        setParentCoachings(parentCoachingData.parentCoachings);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load program management right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOverview();
  }, []);

  const latestCohort = useMemo(() => cohorts[0] ?? null, [cohorts]);

  const coachingsByCohortId = useMemo(() => {
    return parentCoachings.reduce<Record<string, ParentCoachingWithRelationsRecord[]>>((accumulator, record) => {
      const current = accumulator[record.cohort_id] ?? [];
      current.push(record);
      accumulator[record.cohort_id] = current;
      return accumulator;
    }, {});
  }, [parentCoachings]);

  const totalBudgetAmount = useMemo(
    () =>
      cohorts.reduce(
        (sum, cohort) =>
          sum +
          (cohort.workshop_budget_amount ?? 0) +
          (cohort.one_to_one_budget_amount ?? 0) +
          (cohort.other_budget_amount ?? 0),
        0,
      ),
    [cohorts],
  );

  const totalBudgetHours = useMemo(
    () =>
      cohorts.reduce(
        (sum, cohort) =>
          sum +
          (cohort.workshop_budget_hours ?? 0) +
          (cohort.one_to_one_budget_hours ?? 0) +
          (cohort.other_budget_hours ?? 0),
        0,
      ),
    [cohorts],
  );

  const notReadyCoachSessions = useMemo(
    () => parentCoachings.filter((record) => record.onboarding_status !== "ready").length,
    [parentCoachings],
  );

  const totalCommittedAmount = useMemo(
    () => parentCoachings.reduce((sum, record) => sum + getPlannedAmount(record), 0),
    [parentCoachings],
  );

  const totalCommittedHours = useMemo(
    () => parentCoachings.reduce((sum, record) => sum + (record.planned_budget_hours ?? 0), 0),
    [parentCoachings],
  );

  const remainingBudgetAmount = Math.max(totalBudgetAmount - totalCommittedAmount, 0);
  const remainingBudgetHours = Math.max(totalBudgetHours - totalCommittedHours, 0);

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>Program management</h2>
            <p>Manage cohorts, coach sessions, budgets, and readiness before workshops or one-to-one support happen.</p>
          </div>
        </div>

        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-grid workspace-grid-overview program-dashboard-grid">
        <article className="workspace-card summary-card">
          <span className="summary-label">Latest cohort</span>
          <strong className="summary-value">
            {isLoading ? "..." : latestCohort ? `#${latestCohort.number ?? "?"}` : "0"}
          </strong>
          <span className="summary-meta">
            {latestCohort
              ? `${latestCohort.name} · ${formatCohortBudget(latestCohort)}`
              : "No cohort created yet"}
          </span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Coach sessions</span>
          <strong className="summary-value">{isLoading ? "..." : parentCoachings.length}</strong>
          <span className="summary-meta">Coach and mentor sessions currently planned across all cohorts</span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Committed budget</span>
          <strong className="summary-value">{isLoading ? "..." : `EUR ${totalCommittedAmount}`}</strong>
          <span className="summary-meta">{isLoading ? "..." : `${totalCommittedHours}h already planned into coach sessions`}</span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Budget left</span>
          <strong className="summary-value">{isLoading ? "..." : `EUR ${remainingBudgetAmount}`}</strong>
          <span className="summary-meta">{isLoading ? "..." : `${remainingBudgetHours}h still available to plan`}</span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Need attention</span>
          <strong className="summary-value">{isLoading ? "..." : notReadyCoachSessions}</strong>
          <span className="summary-meta">Coach sessions still missing onboarding or contract steps</span>
        </article>
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>Cohorts at a glance</h2>
            <p>A quick operational view of budgets, startups, and coach sessions inside each cohort.</p>
          </div>
        </div>

        <div className="records-list">
          {!isLoading && cohorts.length === 0 ? <div className="empty-state">No cohorts yet.</div> : null}

          {cohorts.map((cohort) => (
            <article key={cohort.id} className="program-group-card">
              <div className="program-item-topline">
                <div>
                  <strong>{cohort.name}</strong>
                  <p className="program-item-notes">
                    {coachingsByCohortId[cohort.id]?.length ?? 0} coach sessions
                    {" · "}
                    {getLegacyStartupCount(startups, cohort)} startups with matching legacy cohort
                  </p>
                </div>
                <Link href={`/admin/program-management/cohorts/${cohort.id}/edit`} className="secondary-button inline-button">
                  Edit cohort
                </Link>
              </div>

              <div className="pill-row">
                {(coachingsByCohortId[cohort.id] ?? []).length > 0 ? (
                  (coachingsByCohortId[cohort.id] ?? []).slice(0, 4).map((record) => (
                    <span key={record.id} className="pill">
                      {record.name}
                    </span>
                  ))
                ) : (
                  <span className="role-placeholder">No coach sessions linked yet</span>
                )}
              </div>

              <p className="program-item-notes">
                Budget: {formatCohortBudget(cohort)}
              </p>

              <div className="detail-grid detail-grid-compact">
                <div className="detail-item">
                  <strong>Committed</strong>
                  <span>{formatBudgetTotals(getCommittedAmount(coachingsByCohortId[cohort.id] ?? []), getCommittedHours(coachingsByCohortId[cohort.id] ?? []))}</span>
                </div>
                <div className="detail-item">
                  <strong>Left to plan</strong>
                  <span>{formatBudgetTotals(getRemainingAmount(cohort, coachingsByCohortId[cohort.id] ?? []), getRemainingHours(cohort, coachingsByCohortId[cohort.id] ?? []))}</span>
                </div>
              </div>

              <div className="program-timeline">
                <strong className="program-timeline-title">Timeline</strong>
                <div className="program-timeline-list">
                  {buildCohortTimeline(cohort, coachingsByCohortId[cohort.id] ?? []).map((month) => (
                    <article key={month.key} className="program-timeline-row">
                      <div className="program-timeline-month">
                        <strong>{month.label}</strong>
                        <span>{month.sessions.length} session{month.sessions.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="program-timeline-content">
                        {month.sessions.length > 0 ? (
                          month.sessions.map((session) => (
                            <div key={session.id} className="program-session-chip">
                              <strong>{session.name}</strong>
                              <span>
                                {session.profile ? `${session.profile.first_name} ${session.profile.last_name}` : "No coach"}
                                {" · "}
                                {formatSessionTypes(session.session_types)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="role-placeholder">Nothing planned yet</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function normalizeCohortLabel(value: string | null) {
  return (value ?? "").toLowerCase().replace("cohort", "").replace(/\s+/g, "").trim();
}

function getLegacyStartupCount(startups: StartupRecord[], cohort: CohortRecord) {
  const cohortName = normalizeCohortLabel(cohort.name);

  return startups.filter((startup) => normalizeCohortLabel(startup.cohort) === cohortName).length;
}

function formatCohortBudget(cohort: CohortRecord) {
  const totalAmount =
    (cohort.workshop_budget_amount ?? 0) +
    (cohort.one_to_one_budget_amount ?? 0) +
    (cohort.other_budget_amount ?? 0);
  const totalHours =
    (cohort.workshop_budget_hours ?? 0) +
    (cohort.one_to_one_budget_hours ?? 0) +
    (cohort.other_budget_hours ?? 0);

  return `EUR ${totalAmount} · ${totalHours}h`;
}

function formatSessionTypes(values: string[]) {
  if (values.length === 0) {
    return "No format set";
  }

  return values
    .map((value) => formatStatusLabel(value))
    .join(", ");
}

function getPlannedAmount(record: ParentCoachingWithRelationsRecord) {
  if (record.planned_budget_amount !== null) {
    return record.planned_budget_amount;
  }

  if (record.hourly_rate !== null && record.planned_budget_hours !== null) {
    return record.hourly_rate * record.planned_budget_hours;
  }

  return 0;
}

function getCommittedAmount(records: ParentCoachingWithRelationsRecord[]) {
  return records.reduce((sum, record) => sum + getPlannedAmount(record), 0);
}

function getCommittedHours(records: ParentCoachingWithRelationsRecord[]) {
  return records.reduce((sum, record) => sum + (record.planned_budget_hours ?? 0), 0);
}

function getRemainingAmount(cohort: CohortRecord, records: ParentCoachingWithRelationsRecord[]) {
  const total =
    (cohort.workshop_budget_amount ?? 0) +
    (cohort.one_to_one_budget_amount ?? 0) +
    (cohort.other_budget_amount ?? 0);

  return Math.max(total - getCommittedAmount(records), 0);
}

function getRemainingHours(cohort: CohortRecord, records: ParentCoachingWithRelationsRecord[]) {
  const total =
    (cohort.workshop_budget_hours ?? 0) +
    (cohort.one_to_one_budget_hours ?? 0) +
    (cohort.other_budget_hours ?? 0);

  return Math.max(total - getCommittedHours(records), 0);
}

function formatBudgetTotals(amount: number, hours: number) {
  return `EUR ${roundValue(amount)} · ${roundValue(hours)}h`;
}

function buildCohortTimeline(cohort: CohortRecord, records: ParentCoachingWithRelationsRecord[]) {
  const months = getTimelineMonths(cohort, records);

  return months.map((date, index) => ({
    key: date.toISOString(),
    label: `Month ${index + 1} · ${date.toLocaleString("en-US", { month: "short", year: "numeric" })}`,
    sessions: records
      .filter((record) => isInSameMonth(record.planned_start_date, date))
      .sort((left, right) => (left.planned_start_date ?? "").localeCompare(right.planned_start_date ?? "")),
  }));
}

function getTimelineMonths(cohort: CohortRecord, records: ParentCoachingWithRelationsRecord[]) {
  if (cohort.start_date) {
    const start = new Date(`${cohort.start_date}T00:00:00`);
    const end = cohort.end_date ? new Date(`${cohort.end_date}T00:00:00`) : null;
    const inferredCount = end ? getInclusiveMonthDiff(start, end) : 10;
    const monthCount = Math.max(1, Math.min(inferredCount, 10));

    return Array.from({ length: monthCount }, (_, index) => new Date(start.getFullYear(), start.getMonth() + index, 1));
  }

  const uniqueMonths = Array.from(
    new Set(
      records
        .map((record) => record.planned_start_date?.slice(0, 7))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  if (uniqueMonths.length === 0) {
    return [];
  }

  return uniqueMonths.map((value) => new Date(`${value}-01T00:00:00`));
}

function getInclusiveMonthDiff(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function isInSameMonth(value: string | null, date: Date) {
  if (!value) {
    return false;
  }

  const compared = new Date(`${value}T00:00:00`);
  return compared.getFullYear() === date.getFullYear() && compared.getMonth() === date.getMonth();
}

function roundValue(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
