import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  CoachingTagRecord,
  CohortModuleRecord,
  CohortModuleWithRelationsRecord,
  CohortCoachingRecord,
  CohortCoachingSessionRecord,
  CohortCoachingTaskRecord,
  CohortCoachingTaskTemplateRecord,
  CohortCoachingWithRelationsRecord,
  CohortRecord,
  ModuleTemplateRecord,
  ProfileDetailRecord,
  ProfileRecord,
  ProfileRoleRecord,
  StartupRecord,
} from "@/components/admin/types";

function getTodayDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export type CohortFormValues = {
  number: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  workshop_budget_hours: string;
  one_to_one_budget_hours: string;
  other_budget_hours: string;
  workshop_budget_amount: string;
  one_to_one_budget_amount: string;
  other_budget_amount: string;
  status: string;
  notes: string;
};

export type ModuleTemplateFormValues = {
  name: string;
  description: string;
  module_type: string;
  default_notes: string;
};

export type CohortModuleFormValues = {
  cohort_id: string;
  module_template_id: string;
  status: string;
  sequence_number: string;
  start_date: string;
  end_date: string;
  notes: string;
};

export type ParentCoachingFormValues = {
  name: string;
  cohort_id: string;
  cohort_module_id: string;
  module_template_id: string;
  coach_profile_id: string;
  support_role: string;
  tags: string[];
  session_types: string[];
  status: string;
  onboarding_status: string;
  planned_start_date: string;
  planned_end_date: string;
  planned_budget_hours: string;
  hourly_rate: string;
  planned_budget_amount: string;
  hours_allocated: string;
  hours_executed: string;
  payment_type: string;
  payment_notes: string;
  actual_amount: string;
  notes: string;
};

export type CohortCoachingSessionFormValues = {
  title: string;
  startup_id: string;
  session_type: string;
  hourly_rate: string;
  planned_date: string;
  planned_duration_hours: string;
  status: string;
  notes: string;
};

export const defaultCohortFormValues: CohortFormValues = {
  number: "",
  name: "",
  description: "",
  start_date: getTodayDateValue(),
  end_date: getTodayDateValue(),
  workshop_budget_hours: "",
  one_to_one_budget_hours: "",
  other_budget_hours: "",
  workshop_budget_amount: "",
  one_to_one_budget_amount: "",
  other_budget_amount: "",
  status: "planned",
  notes: "",
};

export const defaultModuleTemplateFormValues: ModuleTemplateFormValues = {
  name: "",
  description: "",
  module_type: "coaching",
  default_notes: "",
};

export const defaultCohortModuleFormValues: CohortModuleFormValues = {
  cohort_id: "",
  module_template_id: "",
  status: "planned",
  sequence_number: "",
  start_date: getTodayDateValue(),
  end_date: getTodayDateValue(),
  notes: "",
};

export const defaultParentCoachingFormValues: ParentCoachingFormValues = {
  name: "",
  cohort_id: "",
  cohort_module_id: "",
  module_template_id: "",
  coach_profile_id: "",
  support_role: "coach",
  tags: [],
  session_types: ["workshop"],
  status: "planned",
  onboarding_status: "in_progress",
  planned_start_date: getTodayDateValue(),
  planned_end_date: getTodayDateValue(),
  planned_budget_hours: "",
  hourly_rate: "124.5",
  planned_budget_amount: "",
  hours_allocated: "",
  hours_executed: "",
  payment_type: "actual_hours",
  payment_notes: "",
  actual_amount: "",
  notes: "",
};

export const defaultCohortCoachingSessionFormValues: CohortCoachingSessionFormValues = {
  title: "",
  startup_id: "",
  session_type: "one_to_one",
  hourly_rate: "124.5",
  planned_date: getTodayDateValue(),
  planned_duration_hours: "",
  status: "planned",
  notes: "",
};

const cohortSelectFields = [
  "id",
  "number",
  "name",
  "program_name",
  "description",
  "start_date",
  "end_date",
  "workshop_budget_hours",
  "one_to_one_budget_hours",
  "other_budget_hours",
  "workshop_budget_amount",
  "one_to_one_budget_amount",
  "other_budget_amount",
  "status",
  "notes",
  "created_by",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

const moduleTemplateSelectFields = [
  "id",
  "name",
  "description",
  "module_type",
  "default_notes",
  "created_by",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

const coachingTagSelectFields = [
  "id",
  "name",
  "description",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

const cohortModuleSelectFields = [
  "id",
  "cohort_id",
  "module_template_id",
  "status",
  "sequence_number",
  "start_date",
  "end_date",
  "notes",
  "created_by",
  "created_at",
  "updated_at",
  "record_status",
  "cohorts(id, name, program_name, status)",
  "module_templates(id, name, module_type)",
].join(", ");

const parentCoachingSelectFields = [
  "id",
  "cohort_id",
  "cohort_module_id",
  "module_template_id",
  "profile_id",
  "support_role",
  "internal_code",
  "name",
  "tag",
  "tags",
  "session_types",
  "status",
  "onboarding_status",
  "planned_start_date",
  "planned_end_date",
  "actual_start_date",
  "actual_end_date",
  "planned_budget_hours",
  "hourly_rate",
  "planned_budget_amount",
  "hours_allocated",
  "hours_executed",
  "payment_type",
  "payment_notes",
  "actual_amount",
  "agreement_status_snapshot",
  "agreement_end_date_snapshot",
  "notes",
  "created_by",
  "created_at",
  "updated_at",
  "record_status",
  "cohorts(id, name, number, status)",
  "cohort_modules(id, status, sequence_number, cohorts(id, name, number), module_templates(id, name, module_type))",
  "module_templates(id, name, module_type)",
  "profiles(id, first_name, last_name, email)",
].join(", ");

const parentCoachingTaskSelectFields = [
  "id",
  "cohort_coaching_id",
  "task_template_id",
  "title",
  "description",
  "is_required",
  "status",
  "responsible_person",
  "sequence_number",
  "due_date",
  "completed_at",
  "notes",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

const cohortCoachingSessionSelectFields = [
  "id",
  "cohort_coaching_id",
  "session_type",
  "title",
  "startup_id",
  "hourly_rate",
  "planned_date",
  "planned_duration_hours",
  "status",
  "notes",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

export async function fetchProgramManagementOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: cohortsData, error: cohortsError },
    { data: moduleTemplatesData, error: moduleTemplatesError },
    { data: cohortModulesData, error: cohortModulesError },
    { data: parentCoachingsData, error: parentCoachingsError },
    { data: startupsData, error: startupsError },
  ] = await Promise.all([
    supabase
      .from("cohorts")
      .select(cohortSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("module_templates")
      .select(moduleTemplateSelectFields)
      .eq("record_status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("cohort_modules")
      .select(cohortModuleSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("cohort_coachings")
      .select(parentCoachingSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("startups")
      .select("id, name, cohort, created_at, updated_at")
      .eq("record_status", "active"),
  ]);

  if (cohortsError || moduleTemplatesError || cohortModulesError || parentCoachingsError || startupsError) {
    throw new Error(
      cohortsError?.message ??
        moduleTemplatesError?.message ??
        cohortModulesError?.message ??
        parentCoachingsError?.message ??
        startupsError?.message ??
        "Unable to load program management data.",
    );
  }

  return {
    cohorts: ((cohortsData as unknown) as CohortRecord[]) ?? [],
    moduleTemplates: ((moduleTemplatesData as unknown) as ModuleTemplateRecord[]) ?? [],
    cohortModules: normalizeCohortModules(cohortModulesData),
    parentCoachings: normalizeParentCoachings(parentCoachingsData),
    startups: ((startupsData as unknown) as StartupRecord[]) ?? [],
  };
}

export async function fetchParentCoachingsOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: cohortsData, error: cohortsError },
    { data: coachingTagsData, error: coachingTagsError },
    { data: parentCoachingsData, error: parentCoachingsError },
    { data: parentCoachingTasksData, error: parentCoachingTasksError },
    { data: parentCoachingSessionsData, error: parentCoachingSessionsError },
    { data: startupsData, error: startupsError },
    { data: profilesData, error: profilesError },
    { data: profileDetailsData, error: profileDetailsError },
    { data: profileRolesData, error: profileRolesError },
  ] = await Promise.all([
    supabase
      .from("cohorts")
      .select(cohortSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("coaching_tags").select(coachingTagSelectFields).eq("record_status", "active").order("name", { ascending: true }),
    supabase
      .from("cohort_coachings")
      .select(parentCoachingSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("cohort_coaching_tasks")
      .select(parentCoachingTaskSelectFields)
      .eq("record_status", "active")
      .order("sequence_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cohort_coaching_sessions")
      .select(cohortCoachingSessionSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("startups")
      .select("id, name, cohort, created_at, updated_at, record_status")
      .eq("record_status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, gender, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
      .eq("record_status", "active")
      .order("first_name", { ascending: true }),
    supabase
      .from("profile_details")
      .select("id, profile_id, profile_status, internal_code, drive_url, agreement_status, agreement_end_date, website_status, publication_status, admin_notes, created_at, updated_at, record_status")
      .eq("record_status", "active"),
    supabase
      .from("profile_roles")
      .select("id, role_id, profile_id, created_at, roles(id, name, description)"),
  ]);

  if (
    cohortsError ||
    coachingTagsError ||
    parentCoachingsError ||
    parentCoachingTasksError ||
    parentCoachingSessionsError ||
    startupsError ||
    profilesError ||
    profileDetailsError ||
    profileRolesError
  ) {
    throw new Error(
      cohortsError?.message ??
        coachingTagsError?.message ??
        parentCoachingsError?.message ??
        parentCoachingTasksError?.message ??
        parentCoachingSessionsError?.message ??
        startupsError?.message ??
        profilesError?.message ??
        profileDetailsError?.message ??
        profileRolesError?.message ??
        "Unable to load parent coachings.",
    );
  }

  const profiles = ((profilesData as unknown) as ProfileRecord[]) ?? [];
  const profileDetails = ((profileDetailsData as unknown) as ProfileDetailRecord[]) ?? [];
  const profileRoles = normalizeProfileRoles(profileRolesData);

  const coachProfiles = profiles.filter((profile) =>
    profileRoles.some(
      (profileRole) =>
        profileRole.profile_id === profile.id &&
        (profileRole.role?.name === "coach" || profileRole.role?.name === "mentor"),
    ),
  );

  const teamMemberProfiles = profiles.filter((profile) =>
    profileRoles.some(
      (profileRole) => profileRole.profile_id === profile.id && profileRole.role?.name === "team_member",
    ),
  );

  return {
    cohorts: ((cohortsData as unknown) as CohortRecord[]) ?? [],
    coachingTags: ((coachingTagsData as unknown) as CoachingTagRecord[]) ?? [],
    parentCoachings: normalizeParentCoachings(parentCoachingsData),
    parentCoachingTasks: ((parentCoachingTasksData as unknown) as CohortCoachingTaskRecord[]) ?? [],
    parentCoachingSessions: ((parentCoachingSessionsData as unknown) as CohortCoachingSessionRecord[]) ?? [],
    startups: ((startupsData as unknown) as StartupRecord[]) ?? [],
    coachProfiles,
    teamMemberProfiles,
    profileDetails,
  };
}

export async function createCohort(values: CohortFormValues) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("cohorts").insert({
    number: values.number ? Number(values.number) : null,
    name: values.name.trim(),
    description: values.description.trim() || null,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    workshop_budget_hours: values.workshop_budget_hours ? Number(values.workshop_budget_hours) : null,
    one_to_one_budget_hours: values.one_to_one_budget_hours ? Number(values.one_to_one_budget_hours) : null,
    other_budget_hours: values.other_budget_hours ? Number(values.other_budget_hours) : null,
    workshop_budget_amount: values.workshop_budget_amount ? Number(values.workshop_budget_amount) : null,
    one_to_one_budget_amount: values.one_to_one_budget_amount ? Number(values.one_to_one_budget_amount) : null,
    other_budget_amount: values.other_budget_amount ? Number(values.other_budget_amount) : null,
    status: values.status,
    notes: values.notes.trim() || null,
    created_by: session?.user.id ?? null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCohort(cohortId: string, values: CohortFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("cohorts")
    .update({
      number: values.number ? Number(values.number) : null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      workshop_budget_hours: values.workshop_budget_hours ? Number(values.workshop_budget_hours) : null,
      one_to_one_budget_hours: values.one_to_one_budget_hours ? Number(values.one_to_one_budget_hours) : null,
      other_budget_hours: values.other_budget_hours ? Number(values.other_budget_hours) : null,
      workshop_budget_amount: values.workshop_budget_amount ? Number(values.workshop_budget_amount) : null,
      one_to_one_budget_amount: values.one_to_one_budget_amount ? Number(values.one_to_one_budget_amount) : null,
      other_budget_amount: values.other_budget_amount ? Number(values.other_budget_amount) : null,
      status: values.status,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cohortId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createModuleTemplate(values: ModuleTemplateFormValues) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("module_templates").insert({
    name: values.name.trim(),
    description: values.description.trim() || null,
    module_type: values.module_type.trim() || null,
    default_notes: values.default_notes.trim() || null,
    created_by: session?.user.id ?? null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateModuleTemplate(moduleTemplateId: string, values: ModuleTemplateFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("module_templates")
    .update({
      name: values.name.trim(),
      description: values.description.trim() || null,
      module_type: values.module_type.trim() || null,
      default_notes: values.default_notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", moduleTemplateId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createCohortModule(values: CohortModuleFormValues) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("cohort_modules").insert({
    cohort_id: values.cohort_id,
    module_template_id: values.module_template_id,
    status: values.status,
    sequence_number: values.sequence_number ? Number(values.sequence_number) : null,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    notes: values.notes.trim() || null,
    created_by: session?.user.id ?? null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCohortModule(cohortModuleId: string, values: CohortModuleFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("cohort_modules")
    .update({
      cohort_id: values.cohort_id,
      module_template_id: values.module_template_id,
      status: values.status,
      sequence_number: values.sequence_number ? Number(values.sequence_number) : null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cohortModuleId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createParentCoaching(values: ParentCoachingFormValues) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const coachDetail = await fetchProfileDetailByProfileId(values.coach_profile_id);
  const profile = await fetchProfileById(values.coach_profile_id);
  const internalCode =
    coachDetail?.internal_code ??
    buildCohortCoachingInternalCode(profile.first_name, profile.last_name, values.support_role, values.planned_start_date);

  const plannedBudgetAmount = resolvePlannedBudgetAmount(values);

  const { data, error } = await supabase
    .from("cohort_coachings")
    .insert({
      cohort_id: values.cohort_id,
      cohort_module_id: values.cohort_module_id || null,
      module_template_id: values.module_template_id || null,
      profile_id: values.coach_profile_id,
      support_role: values.support_role,
      internal_code: internalCode,
      name: values.name.trim(),
      tag: values.tags[0] ?? null,
      tags: values.tags,
      session_types: values.session_types,
      status: values.status,
      onboarding_status: values.onboarding_status,
      planned_start_date: values.planned_start_date || null,
      planned_end_date: values.planned_end_date || null,
      planned_budget_hours: values.planned_budget_hours ? Number(values.planned_budget_hours) : null,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : null,
      planned_budget_amount: plannedBudgetAmount,
      hours_allocated: values.hours_allocated ? Number(values.hours_allocated) : null,
      hours_executed: values.hours_executed ? Number(values.hours_executed) : null,
      payment_type: values.payment_type.trim() || null,
      payment_notes: values.payment_notes.trim() || null,
      actual_amount: values.actual_amount ? Number(values.actual_amount) : null,
      agreement_status_snapshot: coachDetail?.agreement_status ?? null,
      agreement_end_date_snapshot: coachDetail?.agreement_end_date ?? null,
      notes: values.notes.trim() || null,
      created_by: session?.user.id ?? null,
      record_status: "active",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id) {
    await createDefaultParentCoachingTasks(data.id, values.support_role);
  }
}

export async function updateParentCoaching(parentCoachingId: string, values: ParentCoachingFormValues) {
  const supabase = createBrowserSupabaseClient();
  const coachDetail = await fetchProfileDetailByProfileId(values.coach_profile_id);
  const profile = await fetchProfileById(values.coach_profile_id);
  const internalCode =
    coachDetail?.internal_code ??
    buildCohortCoachingInternalCode(profile.first_name, profile.last_name, values.support_role, values.planned_start_date);

  const plannedBudgetAmount = resolvePlannedBudgetAmount(values);

  const { error } = await supabase
    .from("cohort_coachings")
    .update({
      cohort_id: values.cohort_id,
      cohort_module_id: values.cohort_module_id || null,
      module_template_id: values.module_template_id || null,
      profile_id: values.coach_profile_id,
      support_role: values.support_role,
      internal_code: internalCode,
      name: values.name.trim(),
      tag: values.tags[0] ?? null,
      tags: values.tags,
      session_types: values.session_types,
      status: values.status,
      onboarding_status: values.onboarding_status,
      planned_start_date: values.planned_start_date || null,
      planned_end_date: values.planned_end_date || null,
      planned_budget_hours: values.planned_budget_hours ? Number(values.planned_budget_hours) : null,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : null,
      planned_budget_amount: plannedBudgetAmount,
      hours_allocated: values.hours_allocated ? Number(values.hours_allocated) : null,
      hours_executed: values.hours_executed ? Number(values.hours_executed) : null,
      payment_type: values.payment_type.trim() || null,
      payment_notes: values.payment_notes.trim() || null,
      actual_amount: values.actual_amount ? Number(values.actual_amount) : null,
      agreement_status_snapshot: coachDetail?.agreement_status ?? null,
      agreement_end_date_snapshot: coachDetail?.agreement_end_date ?? null,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parentCoachingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteParentCoaching(parentCoachingId: string) {
  const supabase = createBrowserSupabaseClient();

  const timestamp = new Date().toISOString();

  const { error: coachingError } = await supabase
    .from("cohort_coachings")
    .update({ record_status: "deleted", updated_at: timestamp })
    .eq("id", parentCoachingId);

  if (coachingError) {
    throw new Error(coachingError.message);
  }

  const { error: taskError } = await supabase
    .from("cohort_coaching_tasks")
    .update({ record_status: "deleted", updated_at: timestamp })
    .eq("cohort_coaching_id", parentCoachingId);

  if (taskError) {
    throw new Error(taskError.message);
  }
}

export async function fetchCohortById(cohortId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("cohorts")
    .select(cohortSelectFields)
    .eq("id", cohortId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as CohortRecord;
}

export async function fetchModuleTemplateById(moduleTemplateId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("module_templates")
    .select(moduleTemplateSelectFields)
    .eq("id", moduleTemplateId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as ModuleTemplateRecord;
}

export async function fetchCohortModuleById(cohortModuleId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("cohort_modules")
    .select(cohortModuleSelectFields)
    .eq("id", cohortModuleId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCohortModules([data])[0];
}

export async function fetchParentCoachingById(parentCoachingId: string) {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: cohortsData, error: cohortsError },
    { data: coachingTagsData, error: coachingTagsError },
    { data: parentCoachingData, error: parentCoachingError },
    { data: parentCoachingTasksData, error: parentCoachingTasksError },
    { data: parentCoachingSessionsData, error: parentCoachingSessionsError },
    { data: startupsData, error: startupsError },
    { data: profilesData, error: profilesError },
    { data: profileDetailsData, error: profileDetailsError },
    { data: profileRolesData, error: profileRolesError },
  ] = await Promise.all([
    supabase
      .from("cohorts")
      .select(cohortSelectFields)
      .eq("record_status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("coaching_tags").select(coachingTagSelectFields).eq("record_status", "active").order("name", { ascending: true }),
    supabase
      .from("cohort_coachings")
      .select(parentCoachingSelectFields)
      .eq("id", parentCoachingId)
      .eq("record_status", "active")
      .single(),
    supabase
      .from("cohort_coaching_tasks")
      .select(parentCoachingTaskSelectFields)
      .eq("cohort_coaching_id", parentCoachingId)
      .eq("record_status", "active")
      .order("sequence_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cohort_coaching_sessions")
      .select(cohortCoachingSessionSelectFields)
      .eq("record_status", "active")
      .eq("cohort_coaching_id", parentCoachingId)
      .order("planned_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("startups")
      .select("id, name, created_at, updated_at, record_status")
      .eq("record_status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, gender, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
      .eq("record_status", "active")
      .order("first_name", { ascending: true }),
    supabase
      .from("profile_details")
      .select("id, profile_id, profile_status, internal_code, drive_url, agreement_status, agreement_end_date, website_status, publication_status, admin_notes, created_at, updated_at, record_status")
      .eq("record_status", "active"),
    supabase
      .from("profile_roles")
      .select("id, role_id, profile_id, created_at, roles(id, name, description)"),
  ]);

  if (
    cohortsError ||
    coachingTagsError ||
    parentCoachingError ||
    parentCoachingTasksError ||
    parentCoachingSessionsError ||
    startupsError ||
    profilesError ||
    profileDetailsError ||
    profileRolesError
  ) {
    throw new Error(
      cohortsError?.message ??
        coachingTagsError?.message ??
        parentCoachingError?.message ??
        parentCoachingTasksError?.message ??
        parentCoachingSessionsError?.message ??
        startupsError?.message ??
        profilesError?.message ??
        profileDetailsError?.message ??
        profileRolesError?.message ??
        "Unable to load parent coaching.",
    );
  }

  const profiles = ((profilesData as unknown) as ProfileRecord[]) ?? [];
  const profileDetails = ((profileDetailsData as unknown) as ProfileDetailRecord[]) ?? [];
  const profileRoles = normalizeProfileRoles(profileRolesData);

  const coachProfiles = profiles.filter((profile) =>
    profileRoles.some(
      (profileRole) =>
        profileRole.profile_id === profile.id &&
        (profileRole.role?.name === "coach" || profileRole.role?.name === "mentor"),
    ),
  );

  const teamMemberProfiles = profiles.filter((profile) =>
    profileRoles.some(
      (profileRole) => profileRole.profile_id === profile.id && profileRole.role?.name === "team_member",
    ),
  );

  return {
    parentCoaching: normalizeParentCoachings([parentCoachingData])[0],
    parentCoachingTasks: ((parentCoachingTasksData as unknown) as CohortCoachingTaskRecord[]) ?? [],
    parentCoachingSessions: ((parentCoachingSessionsData as unknown) as CohortCoachingSessionRecord[]) ?? [],
    startups: ((startupsData as unknown) as StartupRecord[]) ?? [],
    cohorts: ((cohortsData as unknown) as CohortRecord[]) ?? [],
    coachingTags: ((coachingTagsData as unknown) as CoachingTagRecord[]) ?? [],
    coachProfiles,
    teamMemberProfiles,
    profileDetails,
  };
}

export function getCohortFormValues(record: CohortRecord): CohortFormValues {
  return {
    number: record.number?.toString() ?? "",
    name: record.name,
    description: record.description ?? "",
    start_date: record.start_date ?? "",
    end_date: record.end_date ?? "",
    workshop_budget_hours: record.workshop_budget_hours?.toString() ?? "",
    one_to_one_budget_hours: record.one_to_one_budget_hours?.toString() ?? "",
    other_budget_hours: record.other_budget_hours?.toString() ?? "",
    workshop_budget_amount: record.workshop_budget_amount?.toString() ?? "",
    one_to_one_budget_amount: record.one_to_one_budget_amount?.toString() ?? "",
    other_budget_amount: record.other_budget_amount?.toString() ?? "",
    status: record.status,
    notes: record.notes ?? "",
  };
}

export function getModuleTemplateFormValues(record: ModuleTemplateRecord): ModuleTemplateFormValues {
  return {
    name: record.name,
    description: record.description ?? "",
    module_type: record.module_type ?? "coaching",
    default_notes: record.default_notes ?? "",
  };
}

export function getCohortModuleFormValues(record: CohortModuleRecord): CohortModuleFormValues {
  return {
    cohort_id: record.cohort_id,
    module_template_id: record.module_template_id,
    status: record.status,
    sequence_number: record.sequence_number?.toString() ?? "",
    start_date: record.start_date ?? "",
    end_date: record.end_date ?? "",
    notes: record.notes ?? "",
  };
}

export function getParentCoachingFormValues(record: CohortCoachingRecord): ParentCoachingFormValues {
  return {
    name: record.name,
    cohort_id: record.cohort_id,
    cohort_module_id: record.cohort_module_id ?? "",
    module_template_id: record.module_template_id ?? "",
    coach_profile_id: record.profile_id,
    support_role: record.support_role,
    tags: record.tags,
    session_types: record.session_types,
    status: record.status,
    onboarding_status: record.onboarding_status,
    planned_start_date: record.planned_start_date ?? "",
    planned_end_date: record.planned_end_date ?? "",
    planned_budget_hours: record.planned_budget_hours?.toString() ?? "",
    hourly_rate: record.hourly_rate?.toString() ?? "",
    planned_budget_amount: record.planned_budget_amount?.toString() ?? "",
    hours_allocated: record.hours_allocated?.toString() ?? "",
    hours_executed: record.hours_executed?.toString() ?? "",
    payment_type: record.payment_type ?? "",
    payment_notes: record.payment_notes ?? "",
    actual_amount: record.actual_amount?.toString() ?? "",
    notes: record.notes ?? "",
  };
}

export async function updateParentCoachingTasks(tasks: CohortCoachingTaskRecord[]) {
  const supabase = createBrowserSupabaseClient();

  const updates = tasks.map((task) =>
    supabase
      .from("cohort_coaching_tasks")
      .update({
        status: task.status,
        responsible_person: task.responsible_person,
        due_date: task.due_date,
        completed_at: task.completed_at,
        notes: task.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

export async function createCoachingTag(name: string, description: string) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("coaching_tags").insert({
    name: name.trim(),
    description: description.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCoachingTag(tagId: string, name: string, description: string) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("coaching_tags")
    .update({
      name: name.trim(),
      description: description.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tagId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createCohortCoachingSession(
  cohortCoachingId: string,
  values: CohortCoachingSessionFormValues,
) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("cohort_coaching_sessions").insert({
    cohort_coaching_id: cohortCoachingId,
    title: values.title.trim(),
    startup_id: values.startup_id || null,
    session_type: values.session_type,
    hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : 124.5,
    planned_date: values.planned_date || null,
    planned_duration_hours: values.planned_duration_hours ? Number(values.planned_duration_hours) : null,
    status: values.status,
    notes: values.notes.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCohortCoachingSession(
  sessionId: string,
  values: CohortCoachingSessionFormValues,
) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("cohort_coaching_sessions")
    .update({
      title: values.title.trim(),
      startup_id: values.startup_id || null,
      session_type: values.session_type,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : 124.5,
      planned_date: values.planned_date || null,
      planned_duration_hours: values.planned_duration_hours ? Number(values.planned_duration_hours) : null,
      status: values.status,
      notes: values.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCohortCoachingSession(sessionId: string) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("cohort_coaching_sessions")
    .update({ record_status: "deleted", updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeCohortModules(data: unknown) {
  const rows =
    ((data as Array<
      CohortModuleRecord & {
        cohorts?:
          | CohortModuleWithRelationsRecord["cohort"]
          | CohortModuleWithRelationsRecord["cohort"][];
        module_templates?:
          | CohortModuleWithRelationsRecord["module_template"]
          | CohortModuleWithRelationsRecord["module_template"][];
      }
    >) ?? []);

  return rows.map((record) => ({
    id: record.id,
    cohort_id: record.cohort_id,
    module_template_id: record.module_template_id,
    status: record.status,
    sequence_number: record.sequence_number,
    start_date: record.start_date,
    end_date: record.end_date,
    notes: record.notes,
    created_by: record.created_by,
    created_at: record.created_at,
    updated_at: record.updated_at,
    record_status: record.record_status,
    cohort: Array.isArray(record.cohorts) ? (record.cohorts[0] ?? null) : (record.cohorts ?? null),
    module_template: Array.isArray(record.module_templates)
      ? (record.module_templates[0] ?? null)
      : (record.module_templates ?? null),
  })) as CohortModuleWithRelationsRecord[];
}

function normalizeProfileRoles(data: unknown) {
  const rows =
    ((data as Array<
      ProfileRoleRecord & { roles?: ProfileRoleRecord["role"] | ProfileRoleRecord["role"][] }
    >) ?? []);

  return rows.map((profileRole) => ({
    id: profileRole.id,
    role_id: profileRole.role_id,
    profile_id: profileRole.profile_id,
    created_at: profileRole.created_at,
    role: Array.isArray(profileRole.roles)
      ? (profileRole.roles[0] ?? null)
      : (profileRole.roles ?? null),
  })) as ProfileRoleRecord[];
}

function normalizeParentCoachings(data: unknown) {
  const rows =
    ((data as Array<
      CohortCoachingRecord & {
        tag?: string | null;
        cohorts?:
          | CohortCoachingWithRelationsRecord["cohort"]
          | CohortCoachingWithRelationsRecord["cohort"][];
        cohort_modules?:
          | (NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]> & {
              cohort?: NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"];
              module_template?: NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"];
              cohorts?:
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"]
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"][];
              module_templates?:
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"]
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"][];
            })
          | (NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]> & {
              cohort?: NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"];
              module_template?: NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"];
              cohorts?:
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"]
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["cohort"][];
              module_templates?:
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"]
                | NonNullable<CohortCoachingWithRelationsRecord["cohort_module"]>["module_template"][];
            })[];
        module_templates?:
          | CohortCoachingWithRelationsRecord["module_template"]
          | CohortCoachingWithRelationsRecord["module_template"][];
        profiles?:
          | CohortCoachingWithRelationsRecord["profile"]
          | CohortCoachingWithRelationsRecord["profile"][];
      }
    >) ?? []);

  return rows.map((record) => {
    const normalizedCohortModule = Array.isArray(record.cohort_modules)
      ? (record.cohort_modules[0] ?? null)
      : (record.cohort_modules ?? null);

    return {
      id: record.id,
      cohort_id: record.cohort_id,
      cohort_module_id: record.cohort_module_id,
      module_template_id: record.module_template_id,
      profile_id: record.profile_id,
      support_role: record.support_role,
      internal_code: record.internal_code,
      name: record.name,
      tags: Array.isArray(record.tags) ? record.tags : record.tag ? [record.tag] : [],
      session_types: Array.isArray(record.session_types) ? record.session_types : [],
      status: record.status,
      onboarding_status: record.onboarding_status,
      planned_start_date: record.planned_start_date,
      planned_end_date: record.planned_end_date,
      actual_start_date: record.actual_start_date,
      actual_end_date: record.actual_end_date,
      planned_budget_hours: record.planned_budget_hours,
      hourly_rate: record.hourly_rate,
      planned_budget_amount: record.planned_budget_amount,
      hours_allocated: record.hours_allocated,
      hours_executed: record.hours_executed,
      payment_type: record.payment_type,
      payment_notes: record.payment_notes,
      actual_amount: record.actual_amount,
      agreement_status_snapshot: record.agreement_status_snapshot,
      agreement_end_date_snapshot: record.agreement_end_date_snapshot,
      notes: record.notes,
      created_by: record.created_by,
      created_at: record.created_at,
      updated_at: record.updated_at,
      record_status: record.record_status,
      cohort: Array.isArray(record.cohorts) ? (record.cohorts[0] ?? null) : (record.cohorts ?? null),
      cohort_module: normalizedCohortModule
        ? {
            id: normalizedCohortModule.id,
            status: normalizedCohortModule.status,
            sequence_number: normalizedCohortModule.sequence_number,
            cohort: Array.isArray(normalizedCohortModule.cohorts)
              ? (normalizedCohortModule.cohorts[0] ?? null)
              : (normalizedCohortModule.cohorts ?? normalizedCohortModule.cohort ?? null),
            module_template: Array.isArray(normalizedCohortModule.module_templates)
              ? (normalizedCohortModule.module_templates[0] ?? null)
              : (normalizedCohortModule.module_templates ?? normalizedCohortModule.module_template ?? null),
          }
        : null,
      module_template: Array.isArray(record.module_templates)
        ? (record.module_templates[0] ?? null)
        : (record.module_templates ?? null),
      profile: Array.isArray(record.profiles) ? (record.profiles[0] ?? null) : (record.profiles ?? null),
      coach_profile: Array.isArray(record.profiles) ? (record.profiles[0] ?? null) : (record.profiles ?? null),
    };
  }) as CohortCoachingWithRelationsRecord[];
}

async function fetchProfileDetailByProfileId(profileId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("profile_details")
    .select("id, profile_id, profile_status, internal_code, drive_url, agreement_status, agreement_end_date, website_status, publication_status, admin_notes, created_at, updated_at, record_status")
    .eq("profile_id", profileId)
    .eq("record_status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? ((data as unknown) as ProfileDetailRecord) : null;
}

function resolvePlannedBudgetAmount(values: ParentCoachingFormValues) {
  if (values.planned_budget_amount) {
    return Number(values.planned_budget_amount);
  }

  if (values.hourly_rate && values.planned_budget_hours) {
    return Number(values.hourly_rate) * Number(values.planned_budget_hours);
  }

  return null;
}

async function fetchProfileById(profileId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, gender, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
    .eq("id", profileId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as ProfileRecord;
}

function buildCohortCoachingInternalCode(
  firstName: string,
  lastName: string,
  supportRole: string,
  plannedStartDate: string,
) {
  const rolePrefix = supportRole === "mentor" ? "M" : "C";
  const year = plannedStartDate ? new Date(plannedStartDate).getUTCFullYear().toString() : new Date().getUTCFullYear().toString();
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase();

  return `VHP-${rolePrefix}-${normalize(firstName)}-${normalize(lastName)}-${year}`;
}

async function createDefaultParentCoachingTasks(parentCoachingId: string, supportRole: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("cohort_coaching_task_templates")
    .select("id, name, description, support_role, is_required, sequence_number, created_at, updated_at, record_status")
    .eq("record_status", "active")
    .in("support_role", [supportRole, "both"])
    .order("sequence_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const templates = ((data as unknown) as CohortCoachingTaskTemplateRecord[]) ?? [];

  if (templates.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("cohort_coaching_tasks").insert(
    templates.map((template) => ({
      cohort_coaching_id: parentCoachingId,
      task_template_id: template.id,
      title: template.name,
      description: template.description,
      is_required: template.is_required,
      status: "todo",
      sequence_number: template.sequence_number,
      record_status: "active",
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}
