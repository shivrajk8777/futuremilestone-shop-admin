"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  parseDiscountPayload,
} from "../../../lib/discounts";

export interface DiscountActionState {
  error?: string;
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
    return error.issues[0]?.message ?? "Invalid discount data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createDiscountAction(_previousState: DiscountActionState, formData: FormData): Promise<DiscountActionState> {
  try {
    const payload = parseDiscountPayload(formData);
    await createDiscount(payload);

    revalidatePath("/discounts");
    redirect(
      buildStatusRedirect(
        "/discounts",
        "success",
        "Discount campaign created successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}

export async function updateDiscountAction(discountId: string, _previousState: DiscountActionState, formData: FormData): Promise<DiscountActionState> {
  try {
    const payload = parseDiscountPayload(formData);
    await updateDiscount(discountId, payload);

    revalidatePath("/discounts");
    revalidatePath(`/discounts/${discountId}`);
    redirect(
      buildStatusRedirect(
        "/discounts",
        "success",
        "Discount campaign updated successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}

export async function deleteDiscountAction(discountId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await deleteDiscount(discountId);
    revalidatePath("/discounts");
    return { success: true };
  } catch (error) {
    return { error: formatActionError(error) };
  }
}
