"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ParentCoachingForm } from "@/components/admin/parent-coaching-form";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type {
  CoachingTagRecord,
  CohortRecord,
  ParentCoachingTaskRecord,
  ParentCoachingWithRelationsRecord,
  ProfileRecord,
} from "@/components/admin/types";
import {
  createParentCoaching,
  defaultParentCoachingFormValues,
  fetchParentCoachingsOverview,
} from "@/lib/supabase/program-management";

export function ParentCoachingsPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [coachingTags, setCoachingTags] = useState<CoachingTagRecord[]>([]);
  const [parentCoachings, setParentCoachings] = useState<ParentCoachingWithRelationsRecord[]>([]);
  const [parentCoachingTasks, setParentCoachingTasks] = useState<ParentCoachingTaskRecord[]>([]);
  const [coachProfiles, setCoachProfiles] = useState<ProfileRecord[]>([]);
  const [values, setValues] = useState(defaultParentCoachingFormValues);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchParentCoachingsOverview();
      setCohorts(data.cohorts);
      setCoachingTags(data.coachingTags);
      setParentCoachings(data.parentCoachings);
      setParentCoachingTasks(data.parentCoachingTasks);
      setCoachProfiles(data.coachProfiles);
      setValues((current) => ({
        ...current,
        cohort_id: current.cohort_id || data.cohorts[0]?.id || "",
        module_template_id: current.module_template_id || "",
        cohort_module_id: current.cohort_module_id || "",
        coach_profile_id: current.coach_profile_id || data.coachProfiles[0]?.id || "",
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load cohort coachings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createParentCoaching(values);
      setValues(defaultParentCoachingFormValues);
      setIsCreateModalOpen(false);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create cohort coaching.");
    } finally {
      setIsSaving(false);
    }
  }

  const tasksByParentCoachingId = useMemo(() => {
    return parentCoachingTasks.reduce<Record<string, ParentCoachingTaskRecord[]>>((accumulator, task) => {
      const current = accumulator[task.cohort_coaching_id] ?? [];
      current.push(task);
      accumulator[task.cohort_coaching_id] = current;
      return accumulator;
    }, {});
  }, [parentCoachingTasks]);

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Coach sessions</h2>
            <p>Create coach or mentor sessions inside a cohort, track budget and timing, and make sure all required steps happen before delivery.</p>
          </div>
          <button type="button" className="login-button admin-button" onClick={() => setIsCreateModalOpen(true)}>
            Add coach session
          </button>
        </div>
        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>All coach sessions</h2>
            <p>{isLoading ? "Loading coach sessions..." : `${parentCoachings.length} coach session records`}</p>
          </div>
        </div>

        {!isLoading && parentCoachings.length === 0 ? (
          <div className="empty-state">No coach sessions created yet.</div>
        ) : (
        <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cohort</th>
                  <th>Coach / mentor</th>
                  <th>Role</th>
                  <th>Tag</th>
                  <th>Format</th>
                  <th>Readiness</th>
                  <th>Agreement</th>
                  <th>Status</th>
                  <th>Planned</th>
                  <th>Missing steps</th>
                </tr>
              </thead>
              <tbody>
                {parentCoachings.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <Link href={`/admin/program-management/parent-coachings/${record.id}/edit`} className="table-link-button">
                        {record.name}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/admin/program-management/parent-coachings/${record.id}/edit`} className="table-link-button">
                        {record.cohort?.name ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/admin/program-management/parent-coachings/${record.id}/edit`} className="table-link-button">
                        {record.profile ? `${record.profile.first_name} ${record.profile.last_name}` : "—"}
                      </Link>
                    </td>
                    <td>{formatStatusLabel(record.support_role)}</td>
                    <td>{formatTags(record.tags)}</td>
                    <td>{formatSessionTypes(record.session_types)}</td>
                    <td>{formatStatusLabel(record.onboarding_status)}</td>
                    <td>{record.agreement_status_snapshot ? formatStatusLabel(record.agreement_status_snapshot) : "Not set"}</td>
                    <td>
                      <span className={`status-badge status-badge-${record.status.replaceAll("_", "-")}`}>
                        {formatStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>{formatDateRange(record.planned_start_date, record.planned_end_date)}</td>
                    <td>{getMissingRequiredSteps(tasksByParentCoachingId[record.id] ?? [])}</td>
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
                <h2>Add coach session</h2>
                <p>Create one planned coach or mentor session inside a cohort.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <ParentCoachingForm
              title=""
              description=""
              cohorts={cohorts}
              values={values}
              coachingTags={coachingTags}
              coachProfiles={coachProfiles}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Create coach session"
              isSaving={isSaving}
              embedded
            />
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

function getMissingRequiredSteps(tasks: ParentCoachingTaskRecord[]) {
  return tasks.filter((task) => task.is_required && task.status !== "done").length;
}

function formatSessionTypes(values: string[]) {
  if (values.length === 0) {
    return "—";
  }

  return values.map(formatStatusLabel).join(", ");
}

function formatTags(values: string[]) {
  if (values.length === 0) {
    return "—";
  }

  return values.join(", ");
}
