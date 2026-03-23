"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CohortModuleForm } from "@/components/admin/cohort-module-form";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type {
  CohortModuleWithRelationsRecord,
  CohortRecord,
  ModuleTemplateRecord,
  ParentCoachingWithRelationsRecord,
} from "@/components/admin/types";
import {
  createCohortModule,
  defaultCohortModuleFormValues,
  fetchProgramManagementOverview,
} from "@/lib/supabase/program-management";

export function CohortModulesPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplateRecord[]>([]);
  const [cohortModules, setCohortModules] = useState<CohortModuleWithRelationsRecord[]>([]);
  const [parentCoachings, setParentCoachings] = useState<ParentCoachingWithRelationsRecord[]>([]);
  const [values, setValues] = useState(defaultCohortModuleFormValues);
  const [selectedRecord, setSelectedRecord] = useState<CohortModuleWithRelationsRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchProgramManagementOverview();
      setCohorts(data.cohorts);
      setModuleTemplates(data.moduleTemplates);
      setCohortModules(data.cohortModules);
      setParentCoachings(data.parentCoachings);

      const defaultCohortId = data.cohorts[0]?.id ?? "";
      const defaultModuleTemplateId = data.moduleTemplates[0]?.id ?? "";

      setSelectedCohortId((current) => current || defaultCohortId);
      setValues((current) => ({
        ...current,
        cohort_id: current.cohort_id || defaultCohortId,
        module_template_id: current.module_template_id || defaultModuleTemplateId,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load cohort modules.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCohortModule(values);
      setValues((current) => ({
        ...defaultCohortModuleFormValues,
        cohort_id: current.cohort_id,
        module_template_id: current.module_template_id,
      }));
      setIsCreateModalOpen(false);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create cohort module.");
    } finally {
      setIsSaving(false);
    }
  }

  const visibleRecords = useMemo(() => {
    if (!selectedCohortId) {
      return cohortModules;
    }

    return cohortModules.filter((record) => record.cohort_id === selectedCohortId);
  }, [cohortModules, selectedCohortId]);

  const parentCoachingsByCohortModuleId = useMemo(() => {
    return parentCoachings.reduce<Record<string, ParentCoachingWithRelationsRecord[]>>((groups, coaching) => {
      if (!coaching.cohort_module_id) {
        return groups;
      }

      if (!groups[coaching.cohort_module_id]) {
        groups[coaching.cohort_module_id] = [];
      }

      groups[coaching.cohort_module_id].push(coaching);
      return groups;
    }, {});
  }, [parentCoachings]);

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>Cohort modules</h2>
            <p>Link reusable templates into specific cohorts and manage their planning details.</p>
          </div>
        </div>
        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>All cohort modules</h2>
            <p>{isLoading ? "Loading cohort modules..." : `${cohortModules.length} linked modules`}</p>
          </div>
          <div className="page-controls">
            <label className="toolbar-select">
              <span>Filter by cohort</span>
              <select value={selectedCohortId} onChange={(event) => setSelectedCohortId(event.target.value)}>
                <option value="">All cohorts</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="login-button admin-button" onClick={() => setIsCreateModalOpen(true)}>
              Link module
            </button>
          </div>
        </div>

        {!isLoading && visibleRecords.length === 0 ? (
          <div className="empty-state">No cohort modules found.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Module</th>
                  <th>Cohort coachings</th>
                  <th>Status</th>
                  <th>Sequence</th>
                  <th>Dates</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => setSelectedRecord(record)}
                      >
                        {record.cohort?.name ?? "—"}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => setSelectedRecord(record)}
                      >
                        {record.module_template?.name ?? "—"}
                      </button>
                    </td>
                    <td>
                      {parentCoachingsByCohortModuleId[record.id]?.length ?? 0}
                    </td>
                    <td>
                      <span className={`status-badge status-badge-${record.status.replaceAll("_", "-")}`}>
                        {formatStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>{record.sequence_number ?? "—"}</td>
                    <td>{formatDateRange(record.start_date, record.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Link module to cohort</h2>
                <p>Create a cohort-specific module instance.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <CohortModuleForm
              title=""
              description=""
              values={values}
              cohorts={cohorts}
              moduleTemplates={moduleTemplates}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Link module"
              isSaving={isSaving}
              embedded
            />
          </div>
        </div>
      ) : null}

      {selectedRecord ? (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{selectedRecord.module_template?.name ?? "Cohort module"}</h2>
                <p>{selectedRecord.cohort?.name ?? "No cohort"}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Status</strong>
                <span>{formatStatusLabel(selectedRecord.status)}</span>
              </div>
              <div className="detail-item">
                <strong>Sequence</strong>
                <span>{selectedRecord.sequence_number ?? "—"}</span>
              </div>
              <div className="detail-item">
                <strong>Start date</strong>
                <span>{selectedRecord.start_date ?? "—"}</span>
              </div>
              <div className="detail-item">
                <strong>Cohort coachings</strong>
                <span>{parentCoachingsByCohortModuleId[selectedRecord.id]?.length ?? 0}</span>
              </div>
              <div className="detail-item">
                <strong>End date</strong>
                <span>{selectedRecord.end_date ?? "—"}</span>
              </div>
            </div>

            <div className="record-subsection">
              <strong>Cohort coachings inside this module</strong>
              {parentCoachingsByCohortModuleId[selectedRecord.id]?.length ? (
                <div className="pill-row">
                  {parentCoachingsByCohortModuleId[selectedRecord.id].map((coaching) => (
                    <span key={coaching.id} className="status-badge status-badge-in-progress">
                      {coaching.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="role-placeholder">No cohort coachings linked yet.</span>
              )}
            </div>

            {selectedRecord.notes ? (
              <div className="record-subsection">
                <strong>Notes</strong>
                <span>{selectedRecord.notes}</span>
              </div>
            ) : null}

            <div className="record-actions">
              <Link href={`/admin/program-management/cohort-modules/${selectedRecord.id}/edit`} className="secondary-button">
                Edit cohort module
              </Link>
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

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "—";
  }

  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }

  return startDate ?? endDate ?? "—";
}
