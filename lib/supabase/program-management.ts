import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  CohortModuleRecord,
  CohortModuleWithRelationsRecord,
  CohortRecord,
  ModuleTemplateRecord,
  StartupRecord,
} from "@/components/admin/types";

export type CohortFormValues = {
  number: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
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

export const defaultCohortFormValues: CohortFormValues = {
  number: "",
  name: "",
  description: "",
  start_date: "",
  end_date: "",
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
  start_date: "",
  end_date: "",
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

export async function fetchProgramManagementOverview() {
  const supabase = createBrowserSupabaseClient();

  const [
    { data: cohortsData, error: cohortsError },
    { data: moduleTemplatesData, error: moduleTemplatesError },
    { data: cohortModulesData, error: cohortModulesError },
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
      .order("sequence_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("startups")
      .select("id, name, cohort, created_at, updated_at")
      .eq("record_status", "active"),
  ]);

  if (cohortsError || moduleTemplatesError || cohortModulesError || startupsError) {
    throw new Error(
      cohortsError?.message ??
        moduleTemplatesError?.message ??
        cohortModulesError?.message ??
        startupsError?.message ??
        "Unable to load program management data.",
    );
  }

  return {
    cohorts: ((cohortsData as unknown) as CohortRecord[]) ?? [],
    moduleTemplates: ((moduleTemplatesData as unknown) as ModuleTemplateRecord[]) ?? [],
    cohortModules: normalizeCohortModules(cohortModulesData),
    startups: ((startupsData as unknown) as StartupRecord[]) ?? [],
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

export function getCohortFormValues(record: CohortRecord): CohortFormValues {
  return {
    number: record.number?.toString() ?? "",
    name: record.name,
    description: record.description ?? "",
    start_date: record.start_date ?? "",
    end_date: record.end_date ?? "",
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
