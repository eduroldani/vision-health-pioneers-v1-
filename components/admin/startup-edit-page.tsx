"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchStartupById,
  type StartupFormValues,
  updateStartup,
} from "@/lib/supabase/startups";
import { StartupForm } from "@/components/admin/startup-form";

type StartupEditPageProps = {
  startupId: string;
};

export function StartupEditPage({ startupId }: StartupEditPageProps) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<StartupFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStartup() {
      try {
        const startup = await fetchStartupById(startupId);

        setInitialValues({
          name: startup.name,
          notion_page_url: startup.notion_page_url ?? "",
          website_url: startup.website_url ?? "",
          instagram_url: startup.instagram_url ?? "",
          linkedin_url: startup.linkedin_url ?? "",
          eligibility_status: startup.eligibility_status,
          evaluation_status: startup.evaluation_status,
          program_status: startup.program_status,
          notes: startup.notes ?? "",
          cohort: startup.cohort ?? "",
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the startup.",
        );
      }
    }

    void loadStartup();
  }, [startupId]);

  async function handleSubmit(values: StartupFormValues) {
    await updateStartup(startupId, values);
    router.push(`/admin/startups/${startupId}`);
    router.refresh();
  }

  if (errorMessage) {
    return <p className="form-message form-message-error">{errorMessage}</p>;
  }

  if (!initialValues) {
    return (
      <section className="workspace-card page-card">
        <div className="card-heading">
          <h2>Loading startup</h2>
          <p>Preparing the startup form.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="card-heading">
          <h2>Edit startup</h2>
          <p>Update the startup record and its internal tracking fields.</p>
        </div>
        <Link href={`/admin/startups/${startupId}`} className="secondary-button">
          Back to startup
        </Link>
      </div>

      <StartupForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        submittingLabel="Saving changes..."
        title="Startup details"
        description="Edit the startup information used by the internal team."
      />
    </div>
  );
}
