"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchProfileById,
  fetchRoles,
  type ProfileFormValues,
  updateProfile,
} from "@/lib/supabase/profiles";
import { ProfileForm } from "@/components/admin/profile-form";
import type { RoleRecord } from "@/components/admin/types";

type ProfileEditPageProps = {
  profileId: string;
};

export function ProfileEditPage({ profileId }: ProfileEditPageProps) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<ProfileFormValues | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [{ profile, profileDetail, profileRoles }, roles] = await Promise.all([
          fetchProfileById(profileId),
          fetchRoles(),
        ]);
        setAvailableRoles(roles);

        setInitialValues({
          first_name: profile.first_name,
          last_name: profile.last_name,
          gender: profile.gender ?? "",
          email: profile.email ?? "",
          linkedin_url: profile.linkedin_url ?? "",
          website_url: profile.website_url ?? "",
          notes: profile.notes ?? "",
          role_ids: profileRoles.map((profileRole) => profileRole.role_id),
          profile_status: profileDetail?.profile_status ?? "",
          internal_code: profileDetail?.internal_code ?? "",
          drive_url: profileDetail?.drive_url ?? "",
          agreement_status: profileDetail?.agreement_status ?? "",
          agreement_end_date: profileDetail?.agreement_end_date ?? "",
          website_status: profileDetail?.website_status ?? "",
          publication_status: profileDetail?.publication_status ?? "",
          admin_notes: profileDetail?.admin_notes ?? "",
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the profile.",
        );
      }
    }

    void loadProfile();
  }, [profileId]);

  async function handleSubmit(values: ProfileFormValues) {
    await updateProfile(profileId, values);
    router.push(`/admin/profiles/${profileId}`);
    router.refresh();
  }

  if (errorMessage) {
    return <p className="form-message form-message-error">{errorMessage}</p>;
  }

  if (!initialValues) {
    return (
      <section className="workspace-card page-card">
        <div className="card-heading">
          <h2>Loading profile</h2>
          <p>Preparing the profile form.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="card-heading">
          <h2>Edit profile</h2>
          <p>Update the profile information used by the internal team.</p>
        </div>
        <Link href={`/admin/profiles/${profileId}`} className="secondary-button">
          Back to profile
        </Link>
      </div>

      <ProfileForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        submittingLabel="Saving changes..."
        title="Profile details"
        description="Edit the core information for this profile."
        availableRoles={availableRoles}
        showExtendedDetails
      />
    </div>
  );
}
