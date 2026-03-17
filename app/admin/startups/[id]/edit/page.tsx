import { StartupEditPage } from "@/components/admin/startup-edit-page";

type AdminStartupEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminStartupEditRoute({
  params,
}: AdminStartupEditPageProps) {
  const { id } = await params;

  return <StartupEditPage startupId={id} />;
}
