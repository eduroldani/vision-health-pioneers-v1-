"use client";

import Link from "next/link";
import type { CohortRecord, ModuleTemplateRecord } from "@/components/admin/types";
import { cohortModuleStatusOptions } from "@/components/admin/types";
import type { CohortModuleFormValues } from "@/lib/supabase/program-management";

type CohortModuleFormProps = {
  title: string;
  description: string;
  values: CohortModuleFormValues;
  cohorts: CohortRecord[];
  moduleTemplates: ModuleTemplateRecord[];
  onChange: (values: CohortModuleFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSaving?: boolean;
  cancelHref?: string;
  embedded?: boolean;
};

export function CohortModuleForm({
  title,
  description,
  values,
  cohorts,
  moduleTemplates,
  onChange,
  onSubmit,
  submitLabel,
  isSaving = false,
  cancelHref,
  embedded = false,
}: CohortModuleFormProps) {
  const formContent = (
    <>
      {!embedded && title ? (
        <div className="card-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      ) : null}

      <form className="resource-form" onSubmit={onSubmit}>
        <div className="form-two-columns">
          <label className="field">
            <span>Cohort</span>
            <select
              value={values.cohort_id}
              onChange={(event) => onChange({ ...values, cohort_id: event.target.value })}
              required
            >
              <option value="">Select cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Module template</span>
            <select
              value={values.module_template_id}
              onChange={(event) => onChange({ ...values, module_template_id: event.target.value })}
              required
            >
              <option value="">Select module</option>
              {moduleTemplates.map((moduleTemplate) => (
                <option key={moduleTemplate.id} value={moduleTemplate.id}>
                  {moduleTemplate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) => onChange({ ...values, status: event.target.value })}
            >
              {cohortModuleStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Sequence number</span>
            <input
              type="number"
              min="1"
              value={values.sequence_number}
              onChange={(event) => onChange({ ...values, sequence_number: event.target.value })}
              placeholder="1"
            />
          </label>

          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={values.start_date}
              onChange={(event) => onChange({ ...values, start_date: event.target.value })}
            />
          </label>

          <label className="field">
            <span>End date</span>
            <input
              type="date"
              value={values.end_date}
              onChange={(event) => onChange({ ...values, end_date: event.target.value })}
            />
          </label>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            rows={3}
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            placeholder="Cohort-specific planning notes."
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="login-button form-action-button" disabled={isSaving}>
            {isSaving ? "Saving..." : submitLabel}
          </button>
          {cancelHref ? (
            <Link href={cancelHref} className="secondary-button">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
    </>
  );

  if (embedded) {
    return formContent;
  }

  return <section className="workspace-card page-card">{formContent}</section>;
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
