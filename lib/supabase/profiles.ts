import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  AssignmentRecord,
  ProfileRecord,
  ProfileRoleRecord,
  RoleRecord,
  StartupMemberRecord,
  StartupRecord,
} from "@/components/admin/types";

const excludedProfileRoleNames = new Set(["admin"]);

export type ProfileFormValues = {
  first_name: string;
  last_name: string;
  gender: "" | "male" | "female" | "diverse";
  email: string;
  linkedin_url: string;
  website_url: string;
  notes: string;
};

export const defaultProfileFormValues: ProfileFormValues = {
  first_name: "",
  last_name: "",
  gender: "",
  email: "",
  linkedin_url: "",
  website_url: "",
  notes: "",
};

const profileSelectFields = [
  "id",
  "first_name",
  "last_name",
  "gender",
  "email",
  "linkedin_url",
  "website_url",
  "notes",
  "created_by_profile_id",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

export async function fetchActiveProfiles() {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelectFields)
    .eq("record_status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRecord[]) ?? [];
}

export async function fetchProfilesOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: profileData, error: profileError },
    { data: profileRoleData, error: profileRoleError },
    { data: startupMemberData, error: startupMemberError },
    { data: assignmentData, error: assignmentError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(profileSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_roles")
      .select("id, role_id, profile_id, created_at, roles(id, name, description)"),
    supabase
      .from("startup_members")
      .select("id, startup_id, profile_id, relationship_type, notes, created_at, updated_at, record_status")
      .eq("record_status", "active"),
    supabase
      .from("assignments")
      .select(
        "id, startup_id, profile_id, assignment_type, status, due_date, submitted_at, assigned_by_profile_id, notes, score, recommendation, form_url, created_at, updated_at, record_status",
      )
      .eq("record_status", "active")
      .eq("assignment_type", "evaluation"),
  ]);

  if (profileError || profileRoleError || startupMemberError || assignmentError) {
    throw new Error(
      profileError?.message ??
        profileRoleError?.message ??
        startupMemberError?.message ??
        assignmentError?.message ??
        "Unable to load profiles right now.",
    );
  }

  return {
    profiles: (profileData as ProfileRecord[]) ?? [],
    profileRoles: normalizeProfileRoles(profileRoleData),
    startupMembers: (startupMemberData as StartupMemberRecord[]) ?? [],
    assignments: (assignmentData as AssignmentRecord[]) ?? [],
  };
}

export async function fetchProfileById(profileId: string) {
  const supabase = createBrowserSupabaseClient();

  const [{ data: profileData, error: profileError }, { data: profileRoleData, error: profileRoleError }, { data: startupMemberData, error: startupMemberError }, { data: assignmentData, error: assignmentError }, { data: startupData, error: startupError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(profileSelectFields)
        .eq("id", profileId)
        .eq("record_status", "active")
        .single(),
      supabase
        .from("profile_roles")
        .select("id, role_id, profile_id, created_at, roles(id, name, description)")
        .eq("profile_id", profileId),
      supabase
        .from("startup_members")
        .select("id, startup_id, profile_id, relationship_type, notes, created_at, updated_at, record_status")
        .eq("profile_id", profileId)
        .eq("record_status", "active"),
      supabase
        .from("assignments")
        .select(
          "id, startup_id, profile_id, assignment_type, status, due_date, submitted_at, assigned_by_profile_id, notes, score, recommendation, form_url, created_at, updated_at, record_status",
        )
        .eq("profile_id", profileId)
        .eq("record_status", "active"),
      supabase.from("startups").select("id, name, created_at, updated_at"),
    ]);

  if (profileError || profileRoleError || startupMemberError || assignmentError || startupError) {
    throw new Error(
      profileError?.message ??
        profileRoleError?.message ??
        startupMemberError?.message ??
        assignmentError?.message ??
        startupError?.message ??
        "Unable to load the profile.",
    );
  }

  return {
    profile: profileData as ProfileRecord,
    profileRoles: normalizeProfileRoles(profileRoleData),
    startupMembers: (startupMemberData as StartupMemberRecord[]) ?? [],
    assignments: (assignmentData as AssignmentRecord[]) ?? [],
    startups: (startupData as StartupRecord[]) ?? [],
  };
}

export async function fetchRoles() {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.from("roles").select("id, name, description").order("name");

  if (error) {
    throw new Error(error.message);
  }

  return ((data as RoleRecord[]) ?? []).filter((role) => !excludedProfileRoleNames.has(role.name));
}

export async function fetchRolesForProfile(profileId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("profile_roles")
    .select("id, role_id, profile_id, created_at, roles(id, name, description)")
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  return normalizeProfileRoles(data);
}

export async function assignProfileRoles(profileId: string, roleIds: string[]) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("profile_roles").insert(
    roleIds.map((roleId) => ({
      profile_id: profileId,
      role_id: roleId,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfileRoles(profileId: string, roleIds: string[]) {
  const supabase = createBrowserSupabaseClient();

  const { error: deleteError } = await supabase.from("profile_roles").delete().eq("profile_id", profileId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (roleIds.length === 0) {
    return;
  }

  await assignProfileRoles(profileId, roleIds);
}

export async function createProfile(values: ProfileFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("profiles").insert({
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    gender: values.gender || null,
    email: values.email.trim() || null,
    linkedin_url: values.linkedin_url.trim() || null,
    website_url: values.website_url.trim() || null,
    notes: values.notes.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfile(profileId: string, values: ProfileFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      gender: values.gender || null,
      email: values.email.trim() || null,
      linkedin_url: values.linkedin_url.trim() || null,
      website_url: values.website_url.trim() || null,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProfile(profileId: string) {
  const supabase = createBrowserSupabaseClient();
  const timestamp = new Date().toISOString();

  const [{ error: profileError }, { error: startupMembersError }, { error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("id", profileId),
      supabase
        .from("startup_members")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("profile_id", profileId)
        .eq("record_status", "active"),
      supabase
        .from("assignments")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("profile_id", profileId)
        .eq("record_status", "active"),
    ]);

  if (profileError || startupMembersError || assignmentsError) {
    throw new Error(
      profileError?.message ??
        startupMembersError?.message ??
        assignmentsError?.message ??
        "Unable to delete the profile.",
    );
  }
}

function normalizeProfileRoles(data: unknown) {
  return (((data as Array<
    ProfileRoleRecord & { roles?: RoleRecord | RoleRecord[] | null }
  >) ?? []).map((profileRole) => ({
    id: profileRole.id,
    role_id: profileRole.role_id,
    profile_id: profileRole.profile_id,
    created_at: profileRole.created_at,
    role: Array.isArray(profileRole.roles)
      ? (profileRole.roles[0] ?? null)
      : (profileRole.roles ?? null),
  })) as ProfileRoleRecord[]).filter(
    (profileRole) => !profileRole.role?.name || !excludedProfileRoleNames.has(profileRole.role.name),
  );
}
