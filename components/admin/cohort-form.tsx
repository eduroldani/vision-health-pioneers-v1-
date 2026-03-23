"use client";

import Link from "next/link";
import { cohortStatusOptions } from "@/components/admin/types";
import type { CohortFormValues } from "@/lib/supabase/program-management";

type CohortFormProps = {
  title: string;
  description: string;
  values: CohortFormValues;
  onChange: (values: CohortFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSaving?: boolean;
  cancelHref?: string;
  embedded?: boolean;
};

export function CohortForm({
  title,
  description,
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSaving = false,
  cancelHref,
  embedded = false,
}: CohortFormProps) {
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
            <span>Cohort number</span>
            <input
              type="number"
              min="1"
              value={values.number}
              onChange={(event) => onChange({ ...values, number: event.target.value })}
              placeholder="8"
              required
            />
          </label>

          <label className="field">
            <span>Name</span>
            <input
              value={values.name}
              onChange={(event) => onChange({ ...values, name: event.target.value })}
              placeholder="Cohort 8"
              required
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) => onChange({ ...values, status: event.target.value })}
            >
              {cohortStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
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

          <label className="field">
            <span>Workshop hours budget</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={values.workshop_budget_hours}
              onChange={(event) => onChange({ ...values, workshop_budget_hours: event.target.value })}
              placeholder="40"
            />
          </label>

          <label className="field">
            <span>Workshop money budget</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.workshop_budget_amount}
              onChange={(event) => onChange({ ...values, workshop_budget_amount: event.target.value })}
              placeholder="5000"
            />
          </label>

          <label className="field">
            <span>1:1 hours budget</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={values.one_to_one_budget_hours}
              onChange={(event) => onChange({ ...values, one_to_one_budget_hours: event.target.value })}
              placeholder="60"
            />
          </label>

          <label className="field">
            <span>1:1 money budget</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.one_to_one_budget_amount}
              onChange={(event) => onChange({ ...values, one_to_one_budget_amount: event.target.value })}
              placeholder="7500"
            />
          </label>

          <label className="field">
            <span>Other hours budget</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={values.other_budget_hours}
              onChange={(event) => onChange({ ...values, other_budget_hours: event.target.value })}
              placeholder="20"
            />
          </label>

          <label className="field">
            <span>Other money budget</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.other_budget_amount}
              onChange={(event) => onChange({ ...values, other_budget_amount: event.target.value })}
              placeholder="2500"
            />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={values.description}
            onChange={(event) => onChange({ ...values, description: event.target.value })}
            placeholder="Short overview of this cohort."
          />
        </label>

        <label className="field">
          <span>Notes</span>
          <textarea
            rows={3}
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            placeholder="Internal notes"
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
