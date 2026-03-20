import { CohortEditPage } from "@/components/admin/cohort-edit-page";

type AdminProgramManagementCohortEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProgramManagementCohortEditPage({
  params,
}: AdminProgramManagementCohortEditPageProps) {
  const { id } = await params;
  return <CohortEditPage cohortId={id} />;
}
