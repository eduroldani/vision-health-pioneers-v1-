import { AssignmentDetailPage } from "@/components/admin/assignment-detail-page";

type AdminAssignmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminAssignmentDetailPage({
  params,
}: AdminAssignmentDetailPageProps) {
  const { id } = await params;

  return <AssignmentDetailPage assignmentId={id} />;
}
