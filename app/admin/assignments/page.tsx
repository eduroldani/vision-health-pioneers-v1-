import { Suspense } from "react";
import { AssignmentsPage } from "@/components/admin/assignments-page";

export default function AdminAssignmentsPage() {
  return (
    <Suspense fallback={null}>
      <AssignmentsPage />
    </Suspense>
  );
}
