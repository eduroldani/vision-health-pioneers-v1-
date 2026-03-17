"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createStartup, type StartupFormValues } from "@/lib/supabase/startups";
import { StartupForm } from "@/components/admin/startup-form";

export function StartupCreatePage() {
  const router = useRouter();

  async function handleSubmit(values: StartupFormValues) {
    await createStartup(values);
    router.push("/admin/startups");
    router.refresh();
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h2>New startup</h2>
          <p>Create a startup record for the internal operations team.</p>
        </div>
        <Link href="/admin/startups" className="secondary-button">
          See all startups
        </Link>
      </div>

      <StartupForm
        onSubmit={handleSubmit}
        submitLabel="Create startup"
        submittingLabel="Creating startup..."
        title="Startup details"
        description="Fill in the core information used by the internal team."
      />
    </div>
  );
}
