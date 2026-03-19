"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentAppUser } from "@/lib/supabase/users";

type SessionState = "loading" | "authenticated" | "unauthenticated" | "unauthorized";

export function useAdminSession() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error || !session) {
          setSessionState("unauthenticated");
          router.replace("/login");
          return;
        }

        setUserId(session.user.id);
        setUserEmail(session.user.email ?? "");
        const appUser = await ensureCurrentAppUser(
          supabase,
          session.user.id,
          session.user.email ?? null,
        );

        if (!isMounted) {
          return;
        }

        setIsAdmin(appUser.is_admin);
        setProfileId(appUser.profile_id);

        if (!appUser.is_admin) {
          setSessionError("Your user does not have admin access.");
          setSessionState("unauthorized");
          router.replace("/");
          return;
        }

        setSessionState("authenticated");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSessionError(
          error instanceof Error ? error.message : "Unable to validate your session.",
        );
        setSessionState("unauthenticated");
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return {
    sessionState,
    userId,
    userEmail,
    profileId,
    isAdmin,
    sessionError,
  };
}
