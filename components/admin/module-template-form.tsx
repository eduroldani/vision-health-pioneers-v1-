"use client";

import Link from "next/link";
import { moduleTemplateTypeOptions } from "@/components/admin/types";
import type { ModuleTemplateFormValues } from "@/lib/supabase/program-management";

type ModuleTemplateFormProps = {
  title: string;
  description: string;
  values: ModuleTemplateFormValues;
  onChange: (values: ModuleTemplateFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSaving?: boolean;
  cancelHref?: string;
  embedded?: boolean;
};

export function ModuleTemplateForm({
  title,
  description,
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSaving = false,
  cancelHref,
  embedded = false,
}: ModuleTemplateFormProps) {
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
            placeholder="Pitch Coaching"
            required
          />
        </label>

        <label className="field">
          <span>Module type</span>
          <select
            value={values.module_type}
            onChange={(event) => onChange({ ...values, module_type: event.target.value })}
          >
            {moduleTemplateTypeOptions.map((option) => (
              <option key={option} value={option}>
                {formatStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={values.description}
            onChange={(event) => onChange({ ...values, description: event.target.value })}
            placeholder="What this module is meant to deliver."
          />
        </label>

        <label className="field">
          <span>Default notes</span>
          <textarea
            rows={3}
            value={values.default_notes}
            onChange={(event) => onChange({ ...values, default_notes: event.target.value })}
            placeholder="Optional setup notes or delivery guidance."
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
