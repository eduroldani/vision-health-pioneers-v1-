"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ModuleTemplateForm } from "@/components/admin/module-template-form";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type { ModuleTemplateRecord } from "@/components/admin/types";
import {
  createModuleTemplate,
  defaultModuleTemplateFormValues,
  fetchProgramManagementOverview,
} from "@/lib/supabase/program-management";

export function ModuleTemplatesPage() {
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplateRecord[]>([]);
  const [values, setValues] = useState(defaultModuleTemplateFormValues);
  const [selectedModuleTemplate, setSelectedModuleTemplate] = useState<ModuleTemplateRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadModuleTemplates();
  }, []);

  async function loadModuleTemplates() {
    try {
      const data = await fetchProgramManagementOverview();
      setModuleTemplates(data.moduleTemplates);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load module templates.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createModuleTemplate(values);
      setValues(defaultModuleTemplateFormValues);
      setIsCreateModalOpen(false);
      await loadModuleTemplates();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create module template.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Module templates</h2>
            <p>Reusable module definitions like Pitch Coaching, Fundraising, or Regulatory Strategy.</p>
          </div>
          <button type="button" className="login-button admin-button" onClick={() => setIsCreateModalOpen(true)}>
            Add module template
          </button>
        </div>
        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>All module templates</h2>
            <p>{isLoading ? "Loading templates..." : `${moduleTemplates.length} templates`}</p>
          </div>
        </div>

        {!isLoading && moduleTemplates.length === 0 ? (
          <div className="empty-state">No module templates created yet.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {moduleTemplates.map((moduleTemplate) => (
                  <tr key={moduleTemplate.id}>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => setSelectedModuleTemplate(moduleTemplate)}
                      >
                        {moduleTemplate.name}
                      </button>
                    </td>
                    <td>{moduleTemplate.module_type ? formatStatusLabel(moduleTemplate.module_type) : "—"}</td>
                    <td>{moduleTemplate.description ?? "—"}</td>
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
                <h2>Add module template</h2>
                <p>Create a reusable module definition.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <ModuleTemplateForm
              title=""
              description=""
              values={values}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Add module template"
              isSaving={isSaving}
              embedded
            />
          </div>
        </div>
      ) : null}

      {selectedModuleTemplate ? (
        <div className="modal-backdrop" onClick={() => setSelectedModuleTemplate(null)}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>{selectedModuleTemplate.name}</h2>
                <p>Reusable module template</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedModuleTemplate(null)}>
                Close
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Type</strong>
                <span>{selectedModuleTemplate.module_type ? formatStatusLabel(selectedModuleTemplate.module_type) : "—"}</span>
              </div>
              <div className="detail-item">
                <strong>Created</strong>
                <span>{selectedModuleTemplate.created_at.slice(0, 10)}</span>
              </div>
            </div>

            {selectedModuleTemplate.description ? (
              <div className="record-subsection">
                <strong>Description</strong>
                <span>{selectedModuleTemplate.description}</span>
              </div>
            ) : null}

            {selectedModuleTemplate.default_notes ? (
              <div className="record-subsection">
                <strong>Default notes</strong>
                <span>{selectedModuleTemplate.default_notes}</span>
              </div>
            ) : null}

            <div className="record-actions">
              <Link href={`/admin/program-management/module-templates/${selectedModuleTemplate.id}/edit`} className="secondary-button">
                Edit module template
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
