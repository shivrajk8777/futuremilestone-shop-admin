"use server";

import { redirect } from "next/navigation";
import { authenticateAdmin, loginSchema } from "../../lib/auth/admin-users";
import { createAdminSession } from "../../lib/auth/session";

const GENERIC_LOGIN_ERROR =
  "Invalid email or password. Check your credentials and try again.";

export async function loginAction(_previousState, formData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);

  if (!admin) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  await createAdminSession(admin.id);
  redirect("/dashboard");
}
