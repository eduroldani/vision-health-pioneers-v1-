import { Suspense } from "react";
import { GlobalSearchPage } from "@/components/admin/global-search-page";

export default function AdminSearchPage() {
  return (
    <Suspense fallback={null}>
      <GlobalSearchPage />
    </Suspense>
  );
}
