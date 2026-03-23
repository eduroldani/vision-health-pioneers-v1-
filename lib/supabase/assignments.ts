import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AssignmentRecord, ProfileRecord, StartupRecord } from "@/components/admin/types";

export type AssignmentFormValues = {
  startup_id: string;
  profile_id: string;
  assignment_type: string;
  status: string;
  due_date: string;
  submitted_at: string;
  assigned_by_profile_id: string;
  notes: string;
  score: string;
  recommendation: string;
  form_url: string;
};

export type AssignmentFilters = {
  startup_id: string;
  profile_id: string;
  status: string;
  overdue_only: boolean;
};

export function getCurrentDateTimeLocalValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getTodayDateTimeLocalValue() {
  return getCurrentDateTimeLocalValue();
}

export const defaultAssignmentFormValues: AssignmentFormValues = {
  startup_id: "",
  profile_id: "",
  assignment_type: "evaluation",
  status: "assigned",
  due_date: getTodayDateTimeLocalValue(),
  submitted_at: getCurrentDateTimeLocalValue(),
  assigned_by_profile_id: "",
  notes: "",
  score: "",
  recommendation: "",
  form_url: "",
};

export const defaultAssignmentFilters: AssignmentFilters = {
  startup_id: "",
  profile_id: "",
  status: "",
  overdue_only: false,
};

const assignmentSelectFields = [
  "id",
  "startup_id",
  "profile_id",
  "assignment_type",
  "status",
  "due_date",
  "submitted_at",
  "assigned_by_profile_id",
  "notes",
  "score",
  "recommendation",
  "form_url",
  "created_at",
  "updated_at",
  "record_status",
].join(", ");

export async function fetchAssignmentDependencies() {
  const supabase = createBrowserSupabaseClient();

  const [{ data: startupsData, error: startupsError }, { data: profilesData, error: profilesError }] =
    await Promise.all([
      supabase
        .from("startups")
        .select("id, name, created_at, updated_at")
        .eq("record_status", "active")
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
        .eq("record_status", "active")
        .order("first_name", { ascending: true }),
    ]);

  if (startupsError || profilesError) {
    throw new Error(startupsError?.message ?? profilesError?.message ?? "Unable to load assignment dependencies.");
  }

  return {
    startups: (startupsData as StartupRecord[]) ?? [],
    profiles: (profilesData as ProfileRecord[]) ?? [],
  };
}

export async function fetchAssignments(filters: Partial<AssignmentFilters> = {}) {
  const supabase = createBrowserSupabaseClient();

  let query = supabase
    .from("assignments")
    .select(assignmentSelectFields)
    .eq("record_status", "active")
    .eq("assignment_type", "evaluation")
    .order("created_at", { ascending: false });

  if (filters.startup_id) {
    query = query.eq("startup_id", filters.startup_id);
  }

  if (filters.profile_id) {
    query = query.eq("profile_id", filters.profile_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const assignments = ((data as unknown) as AssignmentRecord[]) ?? [];

  if (filters.overdue_only) {
    return assignments.filter(isAssignmentOverdue);
  }

  return assignments;
}

export async function fetchAssignmentById(assignmentId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("assignments")
    .select(assignmentSelectFields)
    .eq("id", assignmentId)
    .eq("record_status", "active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as AssignmentRecord;
}

export async function createAssignment(values: AssignmentFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("assignments").insert({
    startup_id: values.startup_id,
    profile_id: values.profile_id,
    assignment_type: values.assignment_type,
    status: values.status,
    due_date: values.due_date || null,
    submitted_at: values.submitted_at || null,
    assigned_by_profile_id: values.assigned_by_profile_id || null,
    notes: values.notes.trim() || null,
    score: values.score ? Number(values.score) : null,
    recommendation: values.recommendation.trim() || null,
    form_url: values.form_url.trim() || null,
    record_status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAssignment(assignmentId: string, values: AssignmentFormValues) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("assignments")
    .update({
      startup_id: values.startup_id,
      profile_id: values.profile_id,
      assignment_type: values.assignment_type,
      status: values.status,
      due_date: values.due_date || null,
      submitted_at: values.submitted_at || null,
      assigned_by_profile_id: values.assigned_by_profile_id || null,
      notes: values.notes.trim() || null,
      score: values.score ? Number(values.score) : null,
      recommendation: values.recommendation.trim() || null,
      form_url: values.form_url.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getAssignmentFormValues(record: AssignmentRecord): AssignmentFormValues {
  return {
    startup_id: record.startup_id,
    profile_id: record.profile_id,
    assignment_type: record.assignment_type,
    status: record.status,
    due_date: toDateTimeLocalValue(record.due_date),
    submitted_at: toDateTimeLocalValue(record.submitted_at),
    assigned_by_profile_id: record.assigned_by_profile_id ?? "",
    notes: record.notes ?? "",
    score: record.score?.toString() ?? "",
    recommendation: record.recommendation ?? "",
    form_url: record.form_url ?? "",
  };
}

export function isAssignmentOverdue(assignment: AssignmentRecord) {
  return Boolean(
    assignment.due_date &&
      assignment.status !== "submitted" &&
      new Date(assignment.due_date).getTime() < Date.now(),
  );
}

export function deriveStartupEvaluationStatus(assignments: AssignmentRecord[]) {
  if (assignments.length === 0) {
    return "not_assigned";
  }

  const submittedCount = assignments.filter((assignment) => assignment.status === "submitted").length;

  if (submittedCount === assignments.length) {
    return "completed";
  }

  const hasInProgressAssignment = assignments.some(
    (assignment) => assignment.status === "in_progress",
  );

  if (hasInProgressAssignment || submittedCount > 0) {
    return "in_progress";
  }

  return "assigned";
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}
