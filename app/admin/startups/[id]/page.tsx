import { StartupDetailPage } from "@/components/admin/startup-detail-page";

type AdminStartupDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminStartupDetailPage({
  params,
}: AdminStartupDetailPageProps) {
  const { id } = await params;

  return <StartupDetailPage startupId={id} />;
}
