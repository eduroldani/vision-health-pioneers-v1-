"use client";

import { FormEvent, useState } from "react";
import {
  defaultProfileFormValues,
  type ProfileFormValues,
} from "@/lib/supabase/profiles";

type ProfileFormProps = {
  initialValues?: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  description: string;
};

export function ProfileForm({
  initialValues = defaultProfileFormValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  description,
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
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
        error instanceof Error ? error.message : "Unable to save the profile right now.",
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
        <div className="form-two-columns">
          <label className="field">
            <span>First name</span>
            <input
              type="text"
              value={values.first_name}
              onChange={(event) =>
                setValues((current) => ({ ...current, first_name: event.target.value }))
              }
              placeholder="Jane"
              required
            />
          </label>

          <label className="field">
            <span>Last name</span>
            <input
              type="text"
              value={values.last_name}
              onChange={(event) =>
                setValues((current) => ({ ...current, last_name: event.target.value }))
              }
              placeholder="Smith"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Gender</span>
          <select
            value={values.gender}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                gender: event.target.value as ProfileFormValues["gender"],
              }))
            }
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="diverse">Diverse</option>
          </select>
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="jane@example.com"
          />
        </label>

        <div className="form-two-columns">
          <label className="field">
            <span>LinkedIn URL</span>
            <input
              type="url"
              value={values.linkedin_url}
              onChange={(event) =>
                setValues((current) => ({ ...current, linkedin_url: event.target.value }))
              }
              placeholder="https://linkedin.com/in/..."
            />
          </label>

          <label className="field">
            <span>Website URL</span>
            <input
              type="url"
              value={values.website_url}
              onChange={(event) =>
                setValues((current) => ({ ...current, website_url: event.target.value }))
              }
              placeholder="https://example.com"
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
            placeholder="Internal notes about this profile."
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
