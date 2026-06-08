"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import {
  createCollection,
  parseCollectionPayload,
  updateCollection,
} from "../../../lib/collections";

function buildStatusRedirect(pathname, status, message) {
  const params = new URLSearchParams({
    message,
    status,
  });

  return `${pathname}?${params.toString()}`;
}

function formatActionError(error) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid collection data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createCollectionAction(_previousState, formData) {
  try {
    const payload = parseCollectionPayload(formData);
    await createCollection(payload);

    revalidatePath("/collections");
    redirect(
      buildStatusRedirect(
        "/collections",
        "success",
        "Collection created successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}

export async function updateCollectionAction(collectionId, _previousState, formData) {
  try {
    const payload = parseCollectionPayload(formData);
    await updateCollection(collectionId, payload);

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    redirect(
      buildStatusRedirect(
        "/collections",
        "success",
        "Collection updated successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}
