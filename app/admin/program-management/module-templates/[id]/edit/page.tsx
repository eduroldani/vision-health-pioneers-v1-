import { ModuleTemplateEditPage } from "@/components/admin/module-template-edit-page";

type AdminProgramManagementModuleTemplateEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProgramManagementModuleTemplateEditPage({
  params,
}: AdminProgramManagementModuleTemplateEditPageProps) {
  const { id } = await params;
  return <ModuleTemplateEditPage moduleTemplateId={id} />;
}
