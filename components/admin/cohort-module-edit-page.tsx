"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CohortModuleForm } from "@/components/admin/cohort-module-form";
import type { CohortRecord, ModuleTemplateRecord } from "@/components/admin/types";
import {
  defaultCohortModuleFormValues,
  fetchCohortModuleById,
  fetchProgramManagementOverview,
  getCohortModuleFormValues,
  updateCohortModule,
} from "@/lib/supabase/program-management";

type CohortModuleEditPageProps = {
  cohortModuleId: string;
};

export function CohortModuleEditPage({ cohortModuleId }: CohortModuleEditPageProps) {
  const router = useRouter();
  const [values, setValues] = useState(defaultCohortModuleFormValues);
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [record, overview] = await Promise.all([
          fetchCohortModuleById(cohortModuleId),
          fetchProgramManagementOverview(),
        ]);

        setValues(getCohortModuleFormValues(record));
        setCohorts(overview.cohorts);
        setModuleTemplates(overview.moduleTemplates);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load cohort module.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [cohortModuleId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateCohortModule(cohortModuleId, values);
      router.push("/admin/program-management/cohort-modules");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update cohort module.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <section className="workspace-card page-card">Loading cohort module...</section>;
  }

  return (
    <div className="page-stack">
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      <CohortModuleForm
        title="Edit cohort module"
        description="Update the cohort-specific instance of this module."
        values={values}
        cohorts={cohorts}
        moduleTemplates={moduleTemplates}
        onChange={setValues}
        onSubmit={handleSubmit}
        submitLabel="Save cohort module"
        isSaving={isSaving}
        cancelHref="/admin/program-management/cohort-modules"
      />
    </div>
  );
}
