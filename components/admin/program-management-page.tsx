"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type {
  CohortModuleWithRelationsRecord,
  CohortRecord,
  ModuleTemplateRecord,
  StartupRecord,
} from "@/components/admin/types";
import { fetchProgramManagementOverview } from "@/lib/supabase/program-management";

export function ProgramManagementPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplateRecord[]>([]);
  const [cohortModules, setCohortModules] = useState<CohortModuleWithRelationsRecord[]>([]);
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await fetchProgramManagementOverview();
        setCohorts(data.cohorts);
        setModuleTemplates(data.moduleTemplates);
        setCohortModules(data.cohortModules);
        setStartups(data.startups);
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

  const modulesByCohortId = useMemo(() => {
    return cohortModules.reduce<Record<string, CohortModuleWithRelationsRecord[]>>((accumulator, record) => {
      const current = accumulator[record.cohort_id] ?? [];
      current.push(record);
      accumulator[record.cohort_id] = current;
      return accumulator;
    }, {});
  }, [cohortModules]);

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>Program management</h2>
            <p>Structure cohorts, reusable modules, and the cohort-specific modules that will power later coaching workflows.</p>
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
            {latestCohort ? latestCohort.name : "No cohort created yet"}
          </span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Module templates</span>
          <strong className="summary-value">{isLoading ? "..." : moduleTemplates.length}</strong>
          <span className="summary-meta">Reusable modules available across cohorts</span>
        </article>

        <article className="workspace-card summary-card">
          <span className="summary-label">Cohort modules</span>
          <strong className="summary-value">{isLoading ? "..." : cohortModules.length}</strong>
          <span className="summary-meta">Modules currently linked into cohorts</span>
        </article>
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>Modules grouped by cohort</h2>
            <p>A quick operational view of which modules are already set up inside each cohort.</p>
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
                    {modulesByCohortId[cohort.id]?.length ?? 0} modules linked
                    {" · "}
                    {getLegacyStartupCount(startups, cohort)} startups with matching legacy cohort
                  </p>
                </div>
                <Link href={`/admin/program-management/cohorts/${cohort.id}/edit`} className="secondary-button inline-button">
                  Edit cohort
                </Link>
              </div>

              <div className="pill-row">
                {(modulesByCohortId[cohort.id] ?? []).length > 0 ? (
                  (modulesByCohortId[cohort.id] ?? []).map((record) => (
                    <span key={record.id} className="pill">
                      {record.module_template?.name ?? "Unnamed module"}
                    </span>
                  ))
                ) : (
                  <span className="role-placeholder">No modules linked yet</span>
                )}
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
