import { ReactNode } from "react";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
