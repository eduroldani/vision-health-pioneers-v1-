"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  defaultAssignmentFormValues,
  type AssignmentFormValues,
} from "@/lib/supabase/assignments";
import {
  assignmentStatusOptions,
  ProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

type AssignmentFormProps = {
  startups: StartupRecord[];
  profiles: ProfileRecord[];
  initialValues?: AssignmentFormValues;
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  description: string;
  lockedStartupId?: string;
};

export function AssignmentForm({
  startups,
  profiles,
  initialValues = defaultAssignmentFormValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  description,
  lockedStartupId,
}: AssignmentFormProps) {
  const [values, setValues] = useState<AssignmentFormValues>(
    lockedStartupId ? { ...initialValues, startup_id: lockedStartupId } : initialValues,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setValues(lockedStartupId ? { ...initialValues, startup_id: lockedStartupId } : initialValues);
  }, [initialValues, lockedStartupId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        ...values,
        startup_id: lockedStartupId ?? values.startup_id,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the assignment right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="workspace-card page-card">
      {title || description ? (
        <div className="card-heading">
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}

      <form className="resource-form" onSubmit={handleSubmit}>
        <div className="form-two-columns">
          <label className="field">
            <span>Startup</span>
            <select
              value={lockedStartupId ?? values.startup_id}
              onChange={(event) =>
                setValues((current) => ({ ...current, startup_id: event.target.value }))
              }
              disabled={Boolean(lockedStartupId)}
              required
            >
              <option value="">Select a startup</option>
              {startups.map((startup) => (
                <option key={startup.id} value={startup.id}>
                  {startup.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Profile</span>
            <select
              value={values.profile_id}
              onChange={(event) =>
                setValues((current) => ({ ...current, profile_id: event.target.value }))
              }
              required
            >
              <option value="">Select a profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {`${profile.first_name} ${profile.last_name}`.trim()}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-two-columns">
          <label className="field">
            <span>Assignment type</span>
            <select
              value={values.assignment_type}
              onChange={(event) =>
                setValues((current) => ({ ...current, assignment_type: event.target.value }))
              }
            >
              <option value="evaluation">evaluation</option>
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({ ...current, status: event.target.value }))
              }
            >
              {assignmentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-two-columns">
          <label className="field">
            <span>Due date</span>
            <input
              type="datetime-local"
              value={values.due_date}
              onChange={(event) =>
                setValues((current) => ({ ...current, due_date: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Submitted at</span>
            <input
              type="datetime-local"
              value={values.submitted_at}
              onChange={(event) =>
                setValues((current) => ({ ...current, submitted_at: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="form-two-columns">
          <label className="field">
            <span>Assigned by profile</span>
            <select
              value={values.assigned_by_profile_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  assigned_by_profile_id: event.target.value,
                }))
              }
            >
              <option value="">Not set yet</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {`${profile.first_name} ${profile.last_name}`.trim()}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Score</span>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={values.score}
              onChange={(event) =>
                setValues((current) => ({ ...current, score: event.target.value }))
              }
              placeholder="8.5"
            />
          </label>
        </div>

        <div className="form-two-columns">
          <label className="field">
            <span>Recommendation</span>
            <input
              type="text"
              value={values.recommendation}
              onChange={(event) =>
                setValues((current) => ({ ...current, recommendation: event.target.value }))
              }
              placeholder="High-level recommendation"
            />
          </label>

          <label className="field">
            <span>Form URL</span>
            <input
              type="url"
              value={values.form_url}
              onChange={(event) =>
                setValues((current) => ({ ...current, form_url: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            rows={4}
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Internal notes for this assignment."
          />
        </label>

        <button type="submit" className="login-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
    </section>
  );
}
