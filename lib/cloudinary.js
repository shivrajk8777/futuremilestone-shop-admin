import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "./env";

let configured = false;

export function getCloudinaryConfig() {
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

export function createUploadSignature(paramsToSign) {
  getCloudinaryConfig();
  return cloudinary.utils.api_sign_request(paramsToSign, getServerEnv().CLOUDINARY_API_SECRET);
}
