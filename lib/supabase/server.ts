import { createClient } from "@supabase/supabase-js";
import { getSupabaseCredentials } from "@/lib/supabase/config";

export function createServerSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseCredentials();

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
