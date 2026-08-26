"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { updateSettings } from "../../../lib/settings";

export interface MasterActionState {
  error?: string;
}

function buildStatusRedirect(pathname: string, status: string, message: string): string {
  const params = new URLSearchParams({
    message,
    status,
  });

  return `${pathname}?${params.toString()}`;
}

export async function updateSettingsAction(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  try {
    const rawPayload = formData.get("settingsPayload");
    if (!rawPayload || typeof rawPayload !== "string") {
      throw new Error("Settings payload is missing.");
    }

    const payload = JSON.parse(rawPayload);
    await updateSettings(payload);

    revalidatePath("/master");
    
    redirect(
      buildStatusRedirect(
        "/master",
        "success",
        "Master settings updated successfully."
      )
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
