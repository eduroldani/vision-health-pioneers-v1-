"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CohortForm } from "@/components/admin/cohort-form";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type { CohortRecord } from "@/components/admin/types";
import {
  createCohort,
  defaultCohortFormValues,
  fetchProgramManagementOverview,
} from "@/lib/supabase/program-management";

export function CohortsPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [values, setValues] = useState(defaultCohortFormValues);
  const [selectedCohort, setSelectedCohort] = useState<CohortRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadCohorts();
  }, []);

  async function loadCohorts() {
    try {
      const data = await fetchProgramManagementOverview();
      setCohorts(data.cohorts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load cohorts.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCohort(values);
      setValues(defaultCohortFormValues);
      setIsCreateModalOpen(false);
      await loadCohorts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create cohort.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Cohorts</h2>
            <p>Manage cohort numbers, names, dates, and program cycle status.</p>
          </div>
          <button type="button" className="login-button admin-button" onClick={() => setIsCreateModalOpen(true)}>
            Add cohort
          </button>
        </div>
        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>All cohorts</h2>
            <p>{isLoading ? "Loading cohorts..." : `${cohorts.length} cohort records`}</p>
          </div>
        </div>

        {!isLoading && cohorts.length === 0 ? (
          <div className="empty-state">No cohorts created yet.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Start date</th>
                  <th>End date</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.id}>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => setSelectedCohort(cohort)}
                      >
                        {cohort.number ?? "—"}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => setSelectedCohort(cohort)}
                      >
                        {cohort.name}
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge status-badge-${cohort.status.replaceAll("_", "-")}`}>
                        {formatStatusLabel(cohort.status)}
                      </span>
                    </td>
                    <td>{cohort.start_date ?? "—"}</td>
                    <td>{cohort.end_date ?? "—"}</td>
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
                <h2>Add cohort</h2>
                <p>Create a new cohort record.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <CohortForm
              title=""
              description=""
              values={values}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Add cohort"
              isSaving={isSaving}
              embedded
            />
          </div>
        </div>
      ) : null}

      {selectedCohort ? (
        <div className="modal-backdrop" onClick={() => setSelectedCohort(null)}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{selectedCohort.name}</h2>
                <p>Cohort #{selectedCohort.number ?? "—"}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedCohort(null)}>
                Close
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Number</strong>
                <span>{selectedCohort.number ?? "—"}</span>
              </div>
              <div className="detail-item">
                <strong>Status</strong>
                <span>{formatStatusLabel(selectedCohort.status)}</span>
              </div>
              <div className="detail-item">
                <strong>Start date</strong>
                <span>{selectedCohort.start_date ?? "—"}</span>
              </div>
              <div className="detail-item">
                <strong>End date</strong>
                <span>{selectedCohort.end_date ?? "—"}</span>
              </div>
            </div>

            {selectedCohort.description ? (
              <div className="record-subsection">
                <strong>Description</strong>
                <span>{selectedCohort.description}</span>
              </div>
            ) : null}

            {selectedCohort.notes ? (
              <div className="record-subsection">
                <strong>Notes</strong>
                <span>{selectedCohort.notes}</span>
              </div>
            ) : null}

            <div className="record-actions">
              <Link href={`/admin/program-management/cohorts/${selectedCohort.id}/edit`} className="secondary-button">
                Edit cohort
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
