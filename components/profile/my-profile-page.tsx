"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchProfileById, type ProfileFormValues, updateProfile } from "@/lib/supabase/profiles";
import { ensureCurrentAppUser } from "@/lib/supabase/users";
import { ProfileForm } from "@/components/admin/profile-form";

export function MyProfilePage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.replace("/login");
          return;
        }

        const appUser = await ensureCurrentAppUser(
          supabase,
          session.user.id,
          session.user.email ?? null,
        );

        if (!isMounted) {
          return;
        }

        if (!appUser.profile_id) {
          setErrorMessage("This user is not linked to a profile yet.");
          setIsLoading(false);
          return;
        }

        const { profile } = await fetchProfileById(appUser.profile_id);

        if (!isMounted) {
          return;
        }

        setProfileId(profile.id);
        setInitialValues({
          first_name: profile.first_name,
          last_name: profile.last_name,
          gender: profile.gender ?? "",
          email: profile.email ?? "",
          linkedin_url: profile.linkedin_url ?? "",
          website_url: profile.website_url ?? "",
          notes: profile.notes ?? "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load your profile.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(values: ProfileFormValues) {
    if (!profileId) {
      throw new Error("No linked profile found for this user.");
    }

    await updateProfile(profileId, values);
    router.refresh();
  }

  return (
    <main className="page-shell">
      <div className="landing-shell">
        <div className="page-heading">
          <div className="card-heading">
            <h2>My profile</h2>
            <p>Update the profile linked to your user account.</p>
          </div>
          <Link href="/" className="secondary-button">
            Back to home
          </Link>
        </div>

        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        {isLoading ? (
          <section className="workspace-card page-card">
            <div className="card-heading">
              <h2>Loading profile</h2>
              <p>Preparing your profile form.</p>
            </div>
          </section>
        ) : null}

        {!isLoading && initialValues ? (
          <ProfileForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Save my profile"
            submittingLabel="Saving profile..."
            title="Profile details"
            description="You can edit the information connected to your user account here."
          />
        ) : null}
      </div>
    </main>
  );
}
