import { CohortModuleEditPage } from "@/components/admin/cohort-module-edit-page";

type AdminProgramManagementCohortModuleEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProgramManagementCohortModuleEditPage({
  params,
}: AdminProgramManagementCohortModuleEditPageProps) {
  const { id } = await params;
  return <CohortModuleEditPage cohortModuleId={id} />;
}
