import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  MONGODB_DB: z.string().min(1, "MONGODB_DB is required."),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required."),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required."),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required."),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("fjord/products"),
  ADMIN_SESSION_COOKIE_NAME: z
    .string()
    .min(1)
    .default("fjord_admin_session"),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
});

let cachedServerEnv;

export function getServerEnv() {
  if (!cachedServerEnv) {
    const parsed = serverEnvSchema.safeParse(process.env);

    if (!parsed.success) {
      const missingKeys = parsed.error.issues.map((issue) => issue.path.join("."));

      throw new Error(
        `Missing or invalid admin environment variables: ${missingKeys.join(
          ", ",
        )}. Add them to admin-panel/.env.local before starting the admin app.`,
      );
    }

    cachedServerEnv = parsed.data;
  }

  return cachedServerEnv;
}
