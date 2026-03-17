import { ProfileEditPage } from "@/components/admin/profile-edit-page";

type AdminProfileEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminProfileEditRoute({
  params,
}: AdminProfileEditPageProps) {
  const { id } = await params;

  return <ProfileEditPage profileId={id} />;
}
