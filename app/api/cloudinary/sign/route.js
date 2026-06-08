import { NextResponse } from "next/server";
import { getCloudinaryConfig, createUploadSignature } from "../../../../lib/cloudinary";
import { requireAdminSession } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdminSession();

  const { apiKey, cloudName, uploadFolder } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: uploadFolder,
    timestamp,
  };

  const signature = createUploadSignature(paramsToSign);

  return NextResponse.json({
    apiKey,
    cloudName,
    folder: uploadFolder,
    signature,
    timestamp,
  });
}
