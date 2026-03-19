import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  AssignmentRecord,
  ProfileRecord,
  ProfileRoleRecord,
  StartupMemberRecord,
  StartupMemberWithProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

export type StartupFormValues = {
  name: string;
  notion_page_url: string;
  website_url: string;
  instagram_url: string;
  linkedin_url: string;
  eligibility_status: string;
  evaluation_status: string;
  program_status: string;
  notes: string;
  cohort: string;
};

export const defaultStartupFormValues: StartupFormValues = {
  name: "",
  notion_page_url: "",
  website_url: "",
  instagram_url: "",
  linkedin_url: "",
  eligibility_status: "pending",
  evaluation_status: "not_assigned",
  program_status: "applicant",
  notes: "",
  cohort: "",
};

export type StartupMemberFormValues = {
  profile_id: string;
  relationship_type: string;
  notes: string;
};

export const defaultStartupMemberFormValues: StartupMemberFormValues = {
  profile_id: "",
  relationship_type: "founder",
  notes: "",
};

const startupSelectFields = [
  "id",
  "name",
  "notion_page_url",
  "website_url",
  "instagram_url",
  "linkedin_url",
  "eligibility_status",
  "evaluation_status",
  "program_status",
  "notes",
  "cohort",
  "created_by",
  "record_status",
  "created_at",
  "updated_at",
].join(", ");

export async function fetchActiveStartups() {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("startups")
    .select(startupSelectFields)
    .eq("record_status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as StartupRecord[]) ?? [];
}

export async function fetchStartupsOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: startupData, error: startupError },
    { data: memberData, error: memberError },
    { data: assignmentData, error: assignmentError },
  ] = await Promise.all([
    supabase
      .from("startups")
      .select(startupSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("startup_members")
      .select(
        "id, startup_id, profile_id, relationship_type, notes, created_at, updated_at, record_status, profiles(id, first_name, last_name, gender, email, linkedin_url, website_url)",
      )
      .eq("record_status", "active"),
    supabase
      .from("assignments")
      .select(
        "id, startup_id, profile_id, assignment_type, status, due_date, submitted_at, assigned_by_profile_id, notes, score, recommendation, form_url, created_at, updated_at, record_status",
      )
      .eq("record_status", "active")
      .eq("assignment_type", "evaluation"),
  ]);

  if (startupError || memberError || assignmentError) {
    throw new Error(
      startupError?.message ??
        memberError?.message ??
        assignmentError?.message ??
        "Unable to load startups right now.",
    );
  }

  const startupMembers = ((memberData as Array<
    StartupMemberRecord & {
      profiles?: StartupMemberWithProfileRecord["profile"] | StartupMemberWithProfileRecord["profile"][];
    }
  >) ?? []).map((member) => ({
    id: member.id,
    startup_id: member.startup_id,
    profile_id: member.profile_id,
    relationship_type: member.relationship_type,
    notes: member.notes,
    created_at: member.created_at,
    updated_at: member.updated_at,
    record_status: member.record_status,
    profile: Array.isArray(member.profiles) ? (member.profiles[0] ?? null) : (member.profiles ?? null),
  }));

  return {
    startups: (startupData as StartupRecord[]) ?? [],
    startupMembers,
    assignments: (assignmentData as AssignmentRecord[]) ?? [],
  };
}

export async function fetchStartupById(startupId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("startups")
    .select(startupSelectFields)
    .eq("id", startupId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StartupRecord;
}

export async function fetchStartupDetailById(startupId: string) {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: startupData, error: startupError },
    { data: memberData, error: memberError },
    { data: profileData, error: profileError },
    { data: profileRoleData, error: profileRoleError },
  ] = await Promise.all([
    supabase
      .from("startups")
      .select(startupSelectFields)
      .eq("id", startupId)
      .eq("record_status", "active")
      .single(),
    supabase
      .from("startup_members")
      .select(
        "id, startup_id, profile_id, relationship_type, notes, created_at, updated_at, record_status, profiles(id, first_name, last_name, gender, email, linkedin_url, website_url)",
      )
      .eq("startup_id", startupId)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
      .eq("record_status", "active")
      .order("first_name", { ascending: true }),
    supabase
      .from("profile_roles")
      .select("id, role_id, profile_id, created_at, roles(id, name, description)"),
  ]);

  if (startupError || memberError || profileError || profileRoleError) {
    throw new Error(
      startupError?.message ??
        memberError?.message ??
        profileError?.message ??
        profileRoleError?.message ??
        "Unable to load the startup.",
    );
  }

  const startupMembers = ((memberData as Array<
    StartupMemberRecord & { profiles?: StartupMemberWithProfileRecord["profile"] | StartupMemberWithProfileRecord["profile"][] }
  >) ?? []).map((member) => ({
    id: member.id,
    startup_id: member.startup_id,
    profile_id: member.profile_id,
    relationship_type: member.relationship_type,
    notes: member.notes,
    created_at: member.created_at,
    updated_at: member.updated_at,
    record_status: member.record_status,
    profile: Array.isArray(member.profiles) ? (member.profiles[0] ?? null) : (member.profiles ?? null),
  }));

  return {
    startup: startupData as StartupRecord,
    startupMembers,
    profiles: (profileData as ProfileRecord[]) ?? [],
    profileRoles: (((profileRoleData as Array<
      ProfileRoleRecord & { roles?: ProfileRoleRecord["role"] | ProfileRoleRecord["role"][] }
    >) ?? []).map((profileRole) => ({
      id: profileRole.id,
      role_id: profileRole.role_id,
      profile_id: profileRole.profile_id,
      created_at: profileRole.created_at,
      role: Array.isArray(profileRole.roles)
        ? (profileRole.roles[0] ?? null)
        : (profileRole.roles ?? null),
    })) as ProfileRoleRecord[]),
  };
}

export async function createStartup(values: StartupFormValues) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("startups").insert({
    name: values.name.trim(),
    notion_page_url: values.notion_page_url.trim() || null,
    website_url: values.website_url.trim() || null,
    instagram_url: values.instagram_url.trim() || null,
    linkedin_url: values.linkedin_url.trim() || null,
    eligibility_status: values.eligibility_status,
    evaluation_status: values.evaluation_status,
    program_status: values.program_status,
    notes: values.notes.trim() || null,
    cohort: values.cohort.trim() || null,
    created_by: session?.user.id ?? null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateStartup(startupId: string, values: StartupFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("startups")
    .update({
      name: values.name.trim(),
      notion_page_url: values.notion_page_url.trim() || null,
      website_url: values.website_url.trim() || null,
      instagram_url: values.instagram_url.trim() || null,
      linkedin_url: values.linkedin_url.trim() || null,
      eligibility_status: values.eligibility_status,
      evaluation_status: values.evaluation_status,
      program_status: values.program_status,
      notes: values.notes.trim() || null,
      cohort: values.cohort.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", startupId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addStartupMember(
  startupId: string,
  values: StartupMemberFormValues,
) {
  const supabase = createBrowserSupabaseClient();

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("startup_members")
    .select("id")
    .eq("startup_id", startupId)
    .eq("profile_id", values.profile_id)
    .eq("record_status", "active")
    .maybeSingle();

  if (existingMemberError) {
    throw new Error(existingMemberError.message);
  }

  if (existingMember) {
    throw new Error("This profile is already linked to the startup.");
  }

  const { error } = await supabase.from("startup_members").insert({
    startup_id: startupId,
    profile_id: values.profile_id,
    relationship_type: values.relationship_type,
    notes: values.notes.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveStartupMember(startupMemberId: string) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("startup_members")
    .update({
      record_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", startupMemberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteStartup(startupId: string) {
  const supabase = createBrowserSupabaseClient();
  const timestamp = new Date().toISOString();

  const [{ error: startupError }, { error: startupMembersError }, { error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("startups")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("id", startupId),
      supabase
        .from("startup_members")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("startup_id", startupId)
        .eq("record_status", "active"),
      supabase
        .from("assignments")
        .update({
          record_status: "deleted",
          updated_at: timestamp,
        })
        .eq("startup_id", startupId)
        .eq("record_status", "active"),
    ]);

  if (startupError || startupMembersError || assignmentsError) {
    throw new Error(
      startupError?.message ??
        startupMembersError?.message ??
        assignmentsError?.message ??
        "Unable to delete the startup.",
    );
  }
}
