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
  status: string;
  notes: string | null;
  created_by: string | null;
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

export const cohortStatusOptions = ["planned", "active", "completed", "archived"];
export const moduleTemplateTypeOptions = [
  "coaching",
  "mentoring",
  "workshop",
  "expert_session",
  "operations",
];
export const cohortModuleStatusOptions = ["planned", "active", "completed", "cancelled"];
