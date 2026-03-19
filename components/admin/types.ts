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
