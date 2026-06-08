import { NextResponse } from "next/server";
import { createUploadSignature, getCloudinaryConfig } from "../../../../lib/cloudinary";
import { requireAdminSession } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdminSession();

  const { apiKey, cloudName } = getCloudinaryConfig();
  const folder = "fjord/blogs";
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = createUploadSignature(paramsToSign);

  return NextResponse.json({ apiKey, cloudName, folder, signature, timestamp });
}
