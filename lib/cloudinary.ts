import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "./env";

let configured = false;

export interface CloudinaryConfig {
  apiKey: string;
  cloudName: string;
  uploadFolder: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const {
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_FOLDER,
  } = getServerEnv();

  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });

    configured = true;
  }

  return {
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadFolder: CLOUDINARY_UPLOAD_FOLDER,
  };
}

export function createUploadSignature(paramsToSign: Record<string, any>): string {
  getCloudinaryConfig();
  return cloudinary.utils.api_sign_request(paramsToSign, getServerEnv().CLOUDINARY_API_SECRET);
}

export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const cleanUrl = url.split("?")[0];
    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = cleanUrl.substring(uploadIndex + "/upload/".length);

    // If there is a version indicator like /v1234567/ or v1234567/
    const versionMatch = pathAfterUpload.match(/(?:^|\/)v\d+\/(.+)$/);
    if (versionMatch && versionMatch[1]) {
      pathAfterUpload = versionMatch[1];
    }

    // Remove file extension
    const lastDot = pathAfterUpload.lastIndexOf(".");
    if (lastDot !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDot);
    }

    return decodeURIComponent(pathAfterUpload) || null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImage(urlOrPublicId: string): Promise<boolean> {
  if (!urlOrPublicId) return false;

  getCloudinaryConfig();

  const publicId = urlOrPublicId.includes("cloudinary.com")
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
    return result?.result === "ok" || result?.result === "not found";
  } catch (err) {
    console.error(`Failed to delete Cloudinary image (${publicId}):`, err);
    return false;
  }
}

export async function deleteMultipleCloudinaryImages(urlsOrPublicIds: string[]): Promise<void> {
  if (!urlsOrPublicIds || !urlsOrPublicIds.length) return;

  const validPublicIds = urlsOrPublicIds
    .map((item) => (item.includes("cloudinary.com") ? extractCloudinaryPublicId(item) : item))
    .filter((id): id is string => Boolean(id));

  if (validPublicIds.length === 0) return;

  const uniqueIds = Array.from(new Set(validPublicIds));

  await Promise.allSettled(
    uniqueIds.map((id) => deleteCloudinaryImage(id))
  );
}
