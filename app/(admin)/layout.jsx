import AdminShell from "../../components/AdminShell";
import { requireAdminSession } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const session = await requireAdminSession();

  return <AdminShell admin={session.admin}>{children}</AdminShell>;
}
