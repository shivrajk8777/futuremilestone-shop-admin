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

function buildStatusRedirect(pathname, status, message) {
  const params = new URLSearchParams({
    message,
    status,
  });

  return `${pathname}?${params.toString()}`;
}

function formatActionError(error) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid discount data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createDiscountAction(_previousState, formData) {
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

export async function updateDiscountAction(discountId, _previousState, formData) {
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

export async function deleteDiscountAction(discountId) {
  try {
    await deleteDiscount(discountId);
    revalidatePath("/discounts");
    return { success: true };
  } catch (error) {
    return { error: formatActionError(error) };
  }
}
