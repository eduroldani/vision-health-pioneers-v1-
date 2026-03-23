export type StartupRecord = {
  id: string;
  name: string;
  notion_page_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  eligibility_status: string;
  evaluation_status: string;
  program_status: string;
  notes: string | null;
  cohort: string | null;
  created_by: string | null;
  record_status: string;
  created_at: string;
  updated_at: string;
};

export type CohortRecord = {
  id: string;
  number: number | null;
  name: string;
  program_name: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  workshop_budget_hours: number | null;
  one_to_one_budget_hours: number | null;
  other_budget_hours: number | null;
  workshop_budget_amount: number | null;
  one_to_one_budget_amount: number | null;
  other_budget_amount: number | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CoachingTagRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type ModuleTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  module_type: string | null;
  default_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CohortModuleRecord = {
  id: string;
  cohort_id: string;
  module_template_id: string;
  status: string;
  sequence_number: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CohortModuleWithRelationsRecord = CohortModuleRecord & {
  cohort: Pick<CohortRecord, "id" | "name" | "program_name" | "status"> | null;
  module_template: Pick<ModuleTemplateRecord, "id" | "name" | "module_type"> | null;
};

export type CohortCoachingRecord = {
  id: string;
  cohort_id: string;
  cohort_module_id: string | null;
  module_template_id: string | null;
  profile_id: string;
  support_role: "coach" | "mentor";
  internal_code: string | null;
  name: string;
  tags: string[];
  session_types: string[];
  status: string;
  onboarding_status: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  planned_budget_hours: number | null;
  hourly_rate: number | null;
  planned_budget_amount: number | null;
  hours_allocated: number | null;
  hours_executed: number | null;
  payment_type: string | null;
  payment_notes: string | null;
  actual_amount: number | null;
  agreement_status_snapshot: string | null;
  agreement_end_date_snapshot: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CohortCoachingWithRelationsRecord = CohortCoachingRecord & {
  cohort: Pick<CohortRecord, "id" | "name" | "number" | "status"> | null;
  cohort_module: Pick<CohortModuleWithRelationsRecord, "id" | "status" | "sequence_number"> & {
    cohort: Pick<CohortRecord, "id" | "name" | "number"> | null;
    module_template: Pick<ModuleTemplateRecord, "id" | "name" | "module_type"> | null;
  } | null;
  module_template: Pick<ModuleTemplateRecord, "id" | "name" | "module_type"> | null;
  profile: Pick<ProfileRecord, "id" | "first_name" | "last_name" | "email"> | null;
  coach_profile: Pick<ProfileRecord, "id" | "first_name" | "last_name" | "email"> | null;
};

export type CohortCoachingTaskTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  support_role: "coach" | "mentor" | "both";
  is_required: boolean;
  sequence_number: number | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CohortCoachingTaskRecord = {
  id: string;
  cohort_coaching_id: string;
  task_template_id: string | null;
  title: string;
  description: string | null;
  is_required: boolean;
  status: string;
  responsible_person: string | null;
  sequence_number: number | null;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type CohortCoachingSessionRecord = {
  id: string;
  cohort_coaching_id: string;
  session_type: "one_to_one" | "workshop" | "meetup" | "other_event" | "other";
  title: string;
  startup_id: string | null;
  hourly_rate: number | null;
  planned_date: string | null;
  planned_duration_hours: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type ParentCoachingRecord = CohortCoachingRecord;
export type ParentCoachingWithRelationsRecord = CohortCoachingWithRelationsRecord;
export type ParentCoachingTaskTemplateRecord = CohortCoachingTaskTemplateRecord;
export type ParentCoachingTaskRecord = CohortCoachingTaskRecord;

export type ProfileRecord = {
  id: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "diverse" | null;
  email: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  notes: string | null;
  created_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type ProfileDetailRecord = {
  id: string;
  profile_id: string;
  profile_status: string | null;
  internal_code: string | null;
  drive_url: string | null;
  agreement_status: string | null;
  agreement_end_date: string | null;
  website_status: string | null;
  publication_status: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
};

export type ProfileRoleRecord = {
  id: string;
  role_id: string;
  profile_id: string;
  created_at: string;
  role?: RoleRecord | null;
};

export type StartupMemberRecord = {
  id: string;
  startup_id: string;
  profile_id: string;
  relationship_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export type StartupMemberWithProfileRecord = StartupMemberRecord & {
  profile: Pick<
    ProfileRecord,
    "id" | "first_name" | "last_name" | "gender" | "email" | "linkedin_url" | "website_url"
  > | null;
};

export type AssignmentRecord = {
  id: string;
  startup_id: string;
  profile_id: string;
  assignment_type: string;
  status: string;
  due_date: string | null;
  submitted_at: string | null;
  assigned_by_profile_id: string | null;
  notes: string | null;
  score: number | null;
  recommendation: string | null;
  form_url: string | null;
  created_at: string;
  updated_at: string;
  record_status: string;
};

export const eligibilityStatusOptions = ["pending", "passed", "rejected"];
export const evaluationStatusOptions = [
  "not_assigned",
  "assigned",
  "in_progress",
  "completed",
];
export const programStatusOptions = [
  "applicant",
  "selected",
  "active",
  "graduated",
  "dropped",
  "alumni",
];
export const assignmentStatusOptions = [
  "assigned",
  "in_progress",
  "submitted",
];

export const startupMemberRelationshipOptions = [
  "founder",
  "cofounder",
  "evaluator",
  "mentor",
  "coach",
];

export const profileStatusOptions = [
  "active",
  "invited",
  "pending",
  "inactive",
];

export const agreementStatusOptions = [
  "not_started",
  "pending_signature",
  "signed",
  "expired",
  "not_required",
];

export const cohortStatusOptions = ["planned", "active", "completed", "archived"];
export const moduleTemplateTypeOptions = [
  "coaching",
  "mentoring",
  "workshop",
  "expert_session",
  "operations",
];
export const cohortModuleStatusOptions = ["planned", "active", "completed", "cancelled"];
export const cohortCoachingRoleOptions = ["coach", "mentor"];
export const coachSessionDeliveryFormatOptions = [
  "workshop",
  "one_to_one",
  "meetup",
  "other_event",
  "other",
];
export const cohortCoachingStatusOptions = [
  "planned",
  "ready",
  "active",
  "delivered",
  "invoicing",
  "cancelled",
];
export const cohortCoachingOnboardingStatusOptions = [
  "not_started",
  "in_progress",
  "ready",
  "blocked",
];
export const cohortCoachingTaskStatusOptions = [
  "todo",
  "in_progress",
  "done",
  "skipped",
];
export const cohortCoachingSessionTypeOptions = [
  "one_to_one",
  "workshop",
  "meetup",
  "other_event",
  "other",
];

export const parentCoachingStatusOptions = cohortCoachingStatusOptions;
export const parentCoachingTaskStatusOptions = cohortCoachingTaskStatusOptions;
