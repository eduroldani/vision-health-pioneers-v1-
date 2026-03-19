import type { SupabaseClient } from "@supabase/supabase-js";

type AppUserRecord = {
  id: string;
  email: string | null;
  profile_id: string | null;
  is_admin: boolean;
};

export async function ensureCurrentAppUser(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, profile_id, is_admin")
    .eq("id", userId)
    .maybeSingle<AppUserRecord>();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data;
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      profile_id: null,
      is_admin: false,
    })
    .select("id, email, profile_id, is_admin")
    .single<AppUserRecord>();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return insertedData;
}

export type { AppUserRecord };
