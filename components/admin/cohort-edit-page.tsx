"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CohortForm } from "@/components/admin/cohort-form";
import {
  fetchCohortById,
  getCohortFormValues,
  updateCohort,
  defaultCohortFormValues,
} from "@/lib/supabase/program-management";

type CohortEditPageProps = {
  cohortId: string;
};

export function CohortEditPage({ cohortId }: CohortEditPageProps) {
  const router = useRouter();
  const [values, setValues] = useState(defaultCohortFormValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCohort() {
      try {
        const cohort = await fetchCohortById(cohortId);
        setValues(getCohortFormValues(cohort));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load cohort.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCohort();
  }, [cohortId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateCohort(cohortId, values);
      router.push("/admin/program-management/cohorts");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update cohort.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <section className="workspace-card page-card">Loading cohort...</section>;
  }

  return (
    <div className="page-stack">
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      <CohortForm
        title="Edit cohort"
        description="Update cohort number, dates, and status."
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        submitLabel="Save cohort"
        isSaving={isSaving}
        cancelHref="/admin/program-management/cohorts"
      />
    </div>
  );
}
