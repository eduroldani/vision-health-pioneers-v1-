"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  ParentCoachingFormValues,
} from "@/lib/supabase/program-management";
import type {
  CoachingTagRecord,
  CohortRecord,
  ProfileRecord,
} from "@/components/admin/types";
import {
  coachSessionDeliveryFormatOptions,
  cohortCoachingOnboardingStatusOptions,
  cohortCoachingRoleOptions,
  parentCoachingStatusOptions,
} from "@/components/admin/types";

type ParentCoachingFormProps = {
  title: string;
  description: string;
  values: ParentCoachingFormValues;
  cohorts: CohortRecord[];
  coachingTags: CoachingTagRecord[];
  coachProfiles: ProfileRecord[];
  onChange: (values: ParentCoachingFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSaving?: boolean;
  cancelHref?: string;
  embedded?: boolean;
  distributedHours?: number;
  executedHours?: number;
};

export function ParentCoachingForm({
  title,
  description,
  values,
  cohorts,
  coachingTags,
  coachProfiles,
  onChange,
  onSubmit,
  submitLabel,
  isSaving = false,
  cancelHref,
  embedded = false,
  distributedHours = 0,
  executedHours = 0,
}: ParentCoachingFormProps) {
  const expectedAmount =
    values.hourly_rate && values.planned_budget_hours
      ? Number(values.hourly_rate) * Number(values.planned_budget_hours)
      : null;
  const [tagToAdd, setTagToAdd] = useState("");

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
        <label className="field">
          <span>Name</span>
          <input
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            placeholder="Financial modelling"
            required
          />
        </label>

        <div className="form-two-columns">
          <label className="field">
            <span>Cohort</span>
            <select
              value={values.cohort_id}
              onChange={(event) => onChange({ ...values, cohort_id: event.target.value, cohort_module_id: "" })}
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
            <span>Coach or mentor</span>
            <select
              value={values.coach_profile_id}
              onChange={(event) => onChange({ ...values, coach_profile_id: event.target.value })}
              required
            >
              <option value="">Select coach</option>
              {coachProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.first_name} {profile.last_name}
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
              {parentCoachingStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Role in cohort</span>
            <select
              value={values.support_role}
              onChange={(event) => onChange({ ...values, support_role: event.target.value })}
            >
              {cohortCoachingRoleOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Onboarding status</span>
            <select
              value={values.onboarding_status}
              onChange={(event) => onChange({ ...values, onboarding_status: event.target.value })}
            >
              {cohortCoachingOnboardingStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <div className="field field-full">
            <span>Tags</span>
            <div className="session-tag-editor">
              <div className="pill-row">
                {values.tags.length > 0 ? (
                  values.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="pill pill-action"
                      onClick={() =>
                        onChange({
                          ...values,
                          tags: values.tags.filter((currentTag) => currentTag !== tag),
                        })
                      }
                    >
                      {tag} ×
                    </button>
                  ))
                ) : (
                  <span className="role-placeholder">No tags added yet.</span>
                )}
              </div>

              <div className="session-tag-controls">
                <select value={tagToAdd} onChange={(event) => setTagToAdd(event.target.value)}>
                  <option value="">Select tag</option>
                  {coachingTags
                    .filter((tag) => !values.tags.includes(tag.name))
                    .map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    if (!tagToAdd) {
                      return;
                    }

                    onChange({
                      ...values,
                      tags: [...values.tags, tagToAdd],
                    });
                    setTagToAdd("");
                  }}
                >
                  + Add tag
                </button>
              </div>
            </div>
          </div>

          <label className="field">
            <span>Planned start date</span>
            <input
              type="date"
              value={values.planned_start_date}
              onChange={(event) => onChange({ ...values, planned_start_date: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Planned end date</span>
            <input
              type="date"
              value={values.planned_end_date}
              onChange={(event) => onChange({ ...values, planned_end_date: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Payment type</span>
            <select
              value={values.payment_type}
              onChange={(event) => onChange({ ...values, payment_type: event.target.value })}
            >
              <option value="actual_hours">Actual Hours</option>
              <option value="double_hours">Double Hours</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="field">
            <span>Hours budgeted</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={values.planned_budget_hours}
              onChange={(event) => onChange({ ...values, planned_budget_hours: event.target.value })}
              placeholder="10"
            />
          </label>

          <label className="field">
            <span>Rate</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.hourly_rate}
              onChange={(event) => onChange({ ...values, hourly_rate: event.target.value })}
              placeholder="124.50"
            />
          </label>

          <label className="field">
            <span>Expected net amount</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.planned_budget_amount || (expectedAmount !== null ? expectedAmount.toFixed(2) : "")}
              onChange={(event) => onChange({ ...values, planned_budget_amount: event.target.value })}
              placeholder="1245.00"
            />
          </label>

          <label className="field">
            <span>Hours distributed in sub-sessions</span>
            <input value={distributedHours.toFixed(1)} readOnly />
          </label>

          <label className="field">
            <span>Hours executed</span>
            <input value={executedHours.toFixed(1)} readOnly />
          </label>

          <label className="field">
            <span>Actual net amount</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.actual_amount}
              onChange={(event) => onChange({ ...values, actual_amount: event.target.value })}
              placeholder="0"
            />
          </label>
        </div>

        <label className="field">
          <span>Session types</span>
          <div className="checkbox-stack">
            {coachSessionDeliveryFormatOptions.map((option) => (
              <label key={option} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={values.session_types.includes(option)}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      session_types: event.target.checked
                        ? [...values.session_types, option]
                        : values.session_types.filter((item) => item !== option),
                    })
                  }
                />
                <div className="checkbox-copy">
                  <strong>{formatStatusLabel(option)}</strong>
                </div>
              </label>
            ))}
          </div>
        </label>

        {values.payment_type === "other" ? (
          <label className="field">
            <span>Payment notes</span>
            <textarea
              rows={3}
              value={values.payment_notes}
              onChange={(event) => onChange({ ...values, payment_notes: event.target.value })}
              placeholder="Explain the payment setup"
            />
          </label>
        ) : null}

        <label className="field">
          <span>Info / notes</span>
          <textarea
            rows={4}
            value={values.notes}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
            placeholder="Planning notes, startup context, or delivery comments."
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
