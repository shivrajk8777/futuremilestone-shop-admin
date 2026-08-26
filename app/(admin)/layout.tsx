import { ReactNode } from "react";
import AdminShell from "../../components/AdminShell";
import { requireAdminSession } from "../../lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return <AdminShell admin={session.admin}>{children}</AdminShell>;
}
