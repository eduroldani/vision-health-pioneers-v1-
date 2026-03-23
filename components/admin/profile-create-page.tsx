"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProfile, fetchRoles, type ProfileFormValues } from "@/lib/supabase/profiles";
import { ProfileForm } from "@/components/admin/profile-form";
import type { RoleRecord } from "@/components/admin/types";

export function ProfileCreatePage() {
  const router = useRouter();
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([]);

  useEffect(() => {
    async function loadRoles() {
      const roles = await fetchRoles();
      setAvailableRoles(roles);
    }

    void loadRoles();
  }, []);

  async function handleSubmit(values: ProfileFormValues) {
    const profileId = await createProfile(values);
    const operationalRoleSelected = availableRoles.some(
      (role) =>
        values.role_ids.includes(role.id) &&
        (role.name === "coach" || role.name === "mentor" || role.name === "team_member"),
    );

    if (profileId && operationalRoleSelected) {
      router.push(`/admin/profiles/${profileId}/edit`);
    } else {
      router.push("/admin/profiles");
    }
    router.refresh();
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="card-heading">
          <h2>New profile</h2>
          <p>Create the person and assign their profile type in one step.</p>
        </div>
        <Link href="/admin/profiles" className="secondary-button">
          See all profiles
        </Link>
      </div>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <h2>Onboarding flow</h2>
          <p>Keep the first step simple, then continue to extended details only when needed.</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <strong>1. Create profile</strong>
            <span>Save the basic person information and assign the role in the same form.</span>
          </div>
          <div className="detail-item">
            <strong>2. Complete extended details</strong>
            <span>Coach, mentor, and team-member profiles continue into the operational details step after saving.</span>
          </div>
          <div className="detail-item">
            <strong>3. Use in the system</strong>
            <span>Later, connect the profile to startups or coach sessions depending on their role.</span>
          </div>
        </div>
      </section>

      <ProfileForm
        onSubmit={handleSubmit}
        submitLabel="Create profile"
        submittingLabel="Creating profile..."
        title="Profile details"
        description="Save the basic person information here. Extended operational details come right after for coaches, mentors, and team members."
        availableRoles={availableRoles}
        showExtendedDetails={false}
      />
    </div>
  );
}
