import { ParentCoachingEditPage } from "@/components/admin/parent-coaching-edit-page";

type AdminProgramManagementParentCoachingEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProgramManagementParentCoachingEditPage({
  params,
}: AdminProgramManagementParentCoachingEditPageProps) {
  const { id } = await params;
  return <ParentCoachingEditPage parentCoachingId={id} />;
}
