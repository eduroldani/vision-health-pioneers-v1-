import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  AssignmentRecord,
  ProfileDetailRecord,
  ProfileRecord,
  ProfileRoleRecord,
  RoleRecord,
  StartupMemberRecord,
  StartupRecord,
} from "@/components/admin/types";

const excludedProfileRoleNames = new Set(["admin"]);

function getTodayDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export type ProfileFormValues = {
  first_name: string;
  last_name: string;
  gender: "" | "male" | "female" | "diverse";
  email: string;
  linkedin_url: string;
  website_url: string;
  notes: string;
  role_ids: string[];
  profile_status: string;
  internal_code: string;
  drive_url: string;
  agreement_status: string;
  agreement_end_date: string;
  website_status: string;
  publication_status: string;
  admin_notes: string;
};

export const defaultProfileFormValues: ProfileFormValues = {
  first_name: "",
  last_name: "",
  gender: "",
  email: "",
  linkedin_url: "",
  website_url: "",
  notes: "",
  role_ids: [],
  profile_status: "",
  internal_code: "",
  drive_url: "",
  agreement_status: "",
  agreement_end_date: getTodayDateValue(),
  website_status: "",
  publication_status: "",
  admin_notes: "",
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

  return ((data as unknown) as ProfileRecord[]) ?? [];
}

export async function fetchProfilesOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: profileData, error: profileError },
    { data: profileRoleData, error: profileRoleError },
    { data: profileDetailData, error: profileDetailError },
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
      .from("profile_details")
      .select(
        "id, profile_id, profile_status, internal_code, drive_url, agreement_status, agreement_end_date, website_status, publication_status, admin_notes, created_at, updated_at, record_status",
      )
      .eq("record_status", "active"),
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

  if (profileError || profileRoleError || profileDetailError || startupMemberError || assignmentError) {
    throw new Error(
      profileError?.message ??
        profileRoleError?.message ??
        profileDetailError?.message ??
        startupMemberError?.message ??
        assignmentError?.message ??
        "Unable to load profiles right now.",
    );
  }

  return {
    profiles: ((profileData as unknown) as ProfileRecord[]) ?? [],
    profileRoles: normalizeProfileRoles(profileRoleData),
    profileDetails: ((profileDetailData as unknown) as ProfileDetailRecord[]) ?? [],
    startupMembers: (startupMemberData as StartupMemberRecord[]) ?? [],
    assignments: (assignmentData as AssignmentRecord[]) ?? [],
  };
}

export async function fetchProfileById(profileId: string) {
  const supabase = createBrowserSupabaseClient();

  const [{ data: profileData, error: profileError }, { data: profileDetailData, error: profileDetailError }, { data: profileRoleData, error: profileRoleError }, { data: startupMemberData, error: startupMemberError }, { data: assignmentData, error: assignmentError }, { data: startupData, error: startupError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(profileSelectFields)
        .eq("id", profileId)
        .eq("record_status", "active")
        .single(),
      supabase
        .from("profile_details")
        .select(
          "id, profile_id, profile_status, internal_code, drive_url, agreement_status, agreement_end_date, website_status, publication_status, admin_notes, created_at, updated_at, record_status",
        )
        .eq("profile_id", profileId)
        .eq("record_status", "active")
        .maybeSingle(),
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

  if (profileError || profileDetailError || profileRoleError || startupMemberError || assignmentError || startupError) {
    throw new Error(
      profileError?.message ??
        profileDetailError?.message ??
        profileRoleError?.message ??
        startupMemberError?.message ??
        assignmentError?.message ??
        startupError?.message ??
        "Unable to load the profile.",
    );
  }

  const profile = (profileData as unknown) as ProfileRecord;
  let creatorProfile: Pick<ProfileRecord, "id" | "first_name" | "last_name"> | null = null;

  if (profile.created_by_profile_id) {
    const { data: creatorData, error: creatorError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", profile.created_by_profile_id)
      .eq("record_status", "active")
      .maybeSingle();

    if (creatorError) {
      throw new Error(creatorError.message);
    }

    creatorProfile = creatorData
      ? ((creatorData as unknown) as Pick<ProfileRecord, "id" | "first_name" | "last_name">)
      : null;
  }

  return {
    profile,
    profileDetail: profileDetailData ? ((profileDetailData as unknown) as ProfileDetailRecord) : null,
    profileRoles: normalizeProfileRoles(profileRoleData),
    startupMembers: (startupMemberData as StartupMemberRecord[]) ?? [],
    assignments: (assignmentData as AssignmentRecord[]) ?? [],
    startups: (startupData as StartupRecord[]) ?? [],
    creatorProfile,
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
  await ensureEmailIsUnique(supabase, values.email, null);

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      gender: values.gender || null,
      email: values.email.trim() || null,
      linkedin_url: values.linkedin_url.trim() || null,
      website_url: values.website_url.trim() || null,
      notes: values.notes.trim() || null,
      record_status: "active",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id) {
    await upsertProfileDetails(data.id, values);
    if (values.role_ids.length > 0) {
      await assignProfileRoles(data.id, values.role_ids);
    }
  }

  return data?.id ?? null;
}

export async function updateProfile(profileId: string, values: ProfileFormValues) {
  const supabase = createBrowserSupabaseClient();
  await ensureEmailIsUnique(supabase, values.email, profileId);

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

  await upsertProfileDetails(profileId, values);
  await updateProfileRoles(profileId, values.role_ids);
}

export async function addProfileStartupRelation(
  profileId: string,
  startupId: string,
  relationshipType: string,
  notes: string,
) {
  const supabase = createBrowserSupabaseClient();

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("startup_members")
    .select("id")
    .eq("startup_id", startupId)
    .eq("profile_id", profileId)
    .eq("record_status", "active")
    .maybeSingle();

  if (existingMemberError) {
    throw new Error(existingMemberError.message);
  }

  if (existingMember) {
    throw new Error("This startup relation already exists for the profile.");
  }

  const { error } = await supabase.from("startup_members").insert({
    startup_id: startupId,
    profile_id: profileId,
    relationship_type: relationshipType,
    notes: notes.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function addProfileAssignment(
  profileId: string,
  startupId: string,
  status: string,
  dueDate: string,
  notes: string,
) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("assignments").insert({
    startup_id: startupId,
    profile_id: profileId,
    assignment_type: "evaluation",
    status,
    due_date: dueDate || null,
    submitted_at: null,
    assigned_by_profile_id: null,
    notes: notes.trim() || null,
    score: null,
    recommendation: null,
    form_url: null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertProfileDetails(profileId: string, values: ProfileFormValues) {
  const supabase = createBrowserSupabaseClient();
  const generatedInternalCode = buildInternalCode(values.first_name, values.last_name);
  const internalCode = generatedInternalCode || values.internal_code.trim() || null;

  if (internalCode) {
    const { data: existingCode, error: duplicateError } = await supabase
      .from("profile_details")
      .select("id, profile_id")
      .eq("internal_code", internalCode)
      .eq("record_status", "active");

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    const duplicate = (existingCode ?? []).find((record) => record.profile_id !== profileId);
    if (duplicate) {
      throw new Error(`Internal code ${internalCode} already exists. This profile cannot be saved twice.`);
    }
  }

  const { error } = await supabase.from("profile_details").upsert(
    {
      profile_id: profileId,
      profile_status: values.profile_status.trim() || null,
      internal_code: internalCode,
      drive_url: values.drive_url.trim() || null,
      agreement_status: values.agreement_status.trim() || null,
      agreement_end_date: values.agreement_end_date || null,
      website_status: values.website_status.trim() || null,
      publication_status: values.publication_status.trim() || null,
      admin_notes: values.admin_notes.trim() || null,
      updated_at: new Date().toISOString(),
      record_status: "active",
    },
    { onConflict: "profile_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

function buildInternalCode(firstName: string, lastName: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase();

  const normalizedFirstName = normalize(firstName);
  const normalizedLastName = normalize(lastName);

  if (!normalizedFirstName || !normalizedLastName) {
    return "";
  }

  return `VHP-${normalizedFirstName}-${normalizedLastName}`;
}

async function ensureEmailIsUnique(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  email: string,
  profileId: string | null,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("record_status", "active")
    .ilike("email", normalizedEmail);

  if (error) {
    throw new Error(error.message);
  }

  const duplicate = (data ?? []).find((profile) => profile.id !== profileId);
  if (duplicate) {
    throw new Error(`A profile with email ${normalizedEmail} already exists.`);
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
