"use client";

import { FormEvent, useMemo, useState } from "react";
import { agreementStatusOptions, profileStatusOptions } from "@/components/admin/types";
import type { RoleRecord } from "@/components/admin/types";
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
  availableRoles?: RoleRecord[];
  showExtendedDetails?: boolean;
};

export function ProfileForm({
  initialValues = defaultProfileFormValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  description,
  availableRoles = [],
  showExtendedDetails = true,
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const generatedInternalCode = useMemo(
    () => buildInternalCode(values.first_name, values.last_name),
    [values.first_name, values.last_name],
  );

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

        {availableRoles.length > 0 ? (
          <div className="detail-panel">
            <strong>Profile roles</strong>
            <p>Select what kind of person this is while creating the profile.</p>
            <div className="checkbox-stack">
              {availableRoles.map((role) => (
                <label key={role.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={values.role_ids.includes(role.id)}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        role_ids: event.target.checked
                          ? [...current.role_ids, role.id]
                          : current.role_ids.filter((currentRoleId) => currentRoleId !== role.id),
                      }))
                    }
                  />
                  <div className="checkbox-copy">
                    <strong>{formatStatusLabel(role.name)}</strong>
                    <span>{role.description ?? "No description"}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {showExtendedDetails ? (
          <div className="detail-panel profile-extended-panel">
            <strong>Extended details</strong>
            <p>Fill these for coaches, mentors, team members, or any profile that needs operational onboarding.</p>

            <div className="form-two-columns">
              <label className="field">
                <span>Profile status</span>
                <select
                  value={values.profile_status}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, profile_status: event.target.value }))
                  }
                >
                  <option value="">Select status</option>
                  {profileStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Internal code</span>
                <input
                  type="text"
                  value={generatedInternalCode}
                  onChange={() => undefined}
                  placeholder="VHP-NIKLAS-LAASCH"
                  readOnly
                />
              </label>

              <label className="field">
                <span>Agreement status</span>
                <select
                  value={values.agreement_status}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, agreement_status: event.target.value }))
                  }
                >
                  <option value="">Select agreement status</option>
                  {agreementStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Agreement end date</span>
                <input
                  type="date"
                  value={values.agreement_end_date}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, agreement_end_date: event.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Website status</span>
                <input
                  type="text"
                  value={values.website_status}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, website_status: event.target.value }))
                  }
                  placeholder="Mentors & Coaches"
                />
              </label>

              <label className="field">
                <span>Publication status</span>
                <input
                  type="text"
                  value={values.publication_status}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, publication_status: event.target.value }))
                  }
                  placeholder="Published, Draft, Internal only"
                />
              </label>
            </div>

            <label className="field">
              <span>Drive URL</span>
              <input
                type="url"
                value={values.drive_url}
                onChange={(event) =>
                  setValues((current) => ({ ...current, drive_url: event.target.value }))
                }
                placeholder="https://drive.google.com/..."
              />
            </label>

            <label className="field">
              <span>Admin notes</span>
              <textarea
                rows={4}
                value={values.admin_notes}
                onChange={(event) =>
                  setValues((current) => ({ ...current, admin_notes: event.target.value }))
                }
                placeholder="Agreement context, sourcing notes, onboarding details, or internal follow-up."
              />
            </label>
          </div>
        ) : null}

        <button type="submit" className="login-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>

      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
    </section>
  );
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInternalCode(firstName: string, lastName: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase();

  const normalizedFirstName = normalize(firstName);
  const normalizedLastName = normalize(lastName);

  if (!normalizedFirstName || !normalizedLastName) {
    return "";
  }

  return `VHP-${normalizedFirstName}-${normalizedLastName}`;
}
