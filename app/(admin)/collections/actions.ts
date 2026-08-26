"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import {
  createCollection,
  parseCollectionPayload,
  updateCollection,
  updateCollectionsOrder,
} from "../../../lib/collections";

export interface CollectionActionState {
  error: string;
}

function buildStatusRedirect(pathname: string, status: string, message: string): string {
  const params = new URLSearchParams({
    message,
    status,
  });

  return `${pathname}?${params.toString()}`;
}

function formatActionError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid collection data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createCollectionAction(_previousState: CollectionActionState, formData: FormData): Promise<CollectionActionState> {
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

export async function updateCollectionAction(collectionId: string, _previousState: CollectionActionState, formData: FormData): Promise<CollectionActionState> {
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

export async function reorderCollectionsAction(orderedIds: string[]): Promise<{ success?: boolean; error?: string }> {
  try {
    await updateCollectionsOrder(orderedIds);
    revalidatePath("/collections");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder collections:", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder collections." };
  }
}
