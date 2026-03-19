"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProfile, type ProfileFormValues } from "@/lib/supabase/profiles";
import { ProfileForm } from "@/components/admin/profile-form";

export function ProfileCreatePage() {
  const router = useRouter();

  async function handleSubmit(values: ProfileFormValues) {
    await createProfile(values);
    router.push("/admin/profiles");
    router.refresh();
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="card-heading">
          <h2>New profile</h2>
          <p>Create the person first. Roles and startup links are added after saving.</p>
        </div>
        <Link href="/admin/profiles" className="secondary-button">
          See all profiles
        </Link>
      </div>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <h2>Simple flow</h2>
          <p>Keep this in three steps so it stays easy to understand.</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <strong>1. Create profile</strong>
            <span>Save the basic person information here.</span>
          </div>
          <div className="detail-item">
            <strong>2. Assign profile roles</strong>
            <span>After saving, open the profile and choose roles like Founder, Evaluator, Coach, or Mentor.</span>
          </div>
          <div className="detail-item">
            <strong>3. Link to startups</strong>
            <span>Later, connect the profile to one or more startups from the startup page.</span>
          </div>
        </div>
      </section>

      <ProfileForm
        onSubmit={handleSubmit}
        submitLabel="Create profile"
        submittingLabel="Creating profile..."
        title="Profile details"
        description="Only the basic information goes here. Profile roles can be added after the profile is created."
      />
    </div>
  );
}
