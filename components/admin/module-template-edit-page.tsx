"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleTemplateForm } from "@/components/admin/module-template-form";
import {
  defaultModuleTemplateFormValues,
  fetchModuleTemplateById,
  getModuleTemplateFormValues,
  updateModuleTemplate,
} from "@/lib/supabase/program-management";

type ModuleTemplateEditPageProps = {
  moduleTemplateId: string;
};

export function ModuleTemplateEditPage({ moduleTemplateId }: ModuleTemplateEditPageProps) {
  const router = useRouter();
  const [values, setValues] = useState(defaultModuleTemplateFormValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        const moduleTemplate = await fetchModuleTemplateById(moduleTemplateId);
        setValues(getModuleTemplateFormValues(moduleTemplate));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load module template.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecord();
  }, [moduleTemplateId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateModuleTemplate(moduleTemplateId, values);
      router.push("/admin/program-management/module-templates");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update module template.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <section className="workspace-card page-card">Loading module template...</section>;
  }

  return (
    <div className="page-stack">
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      <ModuleTemplateForm
        title="Edit module template"
        description="Update a reusable module definition."
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        submitLabel="Save module template"
        isSaving={isSaving}
        cancelHref="/admin/program-management/module-templates"
      />
    </div>
  );
}
