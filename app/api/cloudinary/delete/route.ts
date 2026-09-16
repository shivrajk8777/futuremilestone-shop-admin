import { NextResponse } from "next/server";
import { deleteCloudinaryImage } from "../../../../lib/cloudinary";
import { requireAdminSession } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdminSession();

  try {
    const body = await request.json();
    const { url, publicId } = body;

    const target = url || publicId;
    if (!target) {
      return NextResponse.json({ error: "Missing image url or publicId" }, { status: 400 });
    }

    const success = await deleteCloudinaryImage(target);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to delete Cloudinary image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
