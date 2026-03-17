import { ProfileDetailPage } from "@/components/admin/profile-detail-page";

type AdminProfileDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminProfileDetailPage({
  params,
}: AdminProfileDetailPageProps) {
  const { id } = await params;

  return <ProfileDetailPage profileId={id} />;
}
