"use client";

import { FormEvent, useState } from "react";
import {
  defaultStartupFormValues,
  type StartupFormValues,
} from "@/lib/supabase/startups";
import {
  eligibilityStatusOptions,
  evaluationStatusOptions,
  programStatusOptions,
} from "@/components/admin/types";

type StartupFormProps = {
  initialValues?: StartupFormValues;
  onSubmit: (values: StartupFormValues) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  description: string;
};

export function StartupForm({
  initialValues = defaultStartupFormValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  description,
}: StartupFormProps) {
  const [values, setValues] = useState<StartupFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(values);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the startup right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="workspace-card page-card">
      <div className="card-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <form className="resource-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Vision Health Startup"
            required
          />
        </label>

        <div className="form-two-columns">
          <label className="field">
            <span>Eligibility status</span>
            <select
              value={values.eligibility_status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  eligibility_status: event.target.value,
                }))
              }
            >
              {eligibilityStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Program status</span>
            <select
              value={values.program_status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  program_status: event.target.value,
                }))
              }
            >
              {programStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Evaluation status</span>
          <select
            value={values.evaluation_status}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                evaluation_status: event.target.value,
              }))
            }
          >
            {evaluationStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <small className="field-help">
            Keep this simple for now. Later this should be derived from assignments.
          </small>
        </label>

        <div className="form-two-columns">
          <label className="field">
            <span>Cohort</span>
            <input
              type="text"
              value={values.cohort}
              onChange={(event) =>
                setValues((current) => ({ ...current, cohort: event.target.value }))
              }
              placeholder="2026 Spring"
            />
          </label>

          <label className="field">
            <span>Notion page URL</span>
            <input
              type="url"
              value={values.notion_page_url}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  notion_page_url: event.target.value,
                }))
              }
              placeholder="https://www.notion.so/..."
            />
          </label>
        </div>

        <div className="form-two-columns">
          <label className="field">
            <span>Website URL</span>
            <input
              type="url"
              value={values.website_url}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  website_url: event.target.value,
                }))
              }
              placeholder="https://example.com"
            />
          </label>

          <label className="field">
            <span>Instagram URL</span>
            <input
              type="url"
              value={values.instagram_url}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  instagram_url: event.target.value,
                }))
              }
              placeholder="https://instagram.com/..."
            />
          </label>

          <label className="field">
            <span>LinkedIn URL</span>
            <input
              type="url"
              value={values.linkedin_url}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  linkedin_url: event.target.value,
                }))
              }
              placeholder="https://linkedin.com/company/..."
            />
          </label>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            rows={6}
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Internal notes about this startup."
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
