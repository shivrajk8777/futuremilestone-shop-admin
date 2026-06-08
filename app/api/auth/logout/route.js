import { NextResponse } from "next/server";
import { clearAdminSession } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  await clearAdminSession();

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl, { status: 303 });
}
