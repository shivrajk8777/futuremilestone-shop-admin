"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import {
  createProduct,
  parseProductPayload,
  updateProduct,
  updateProductsOrder,
  toggleProductFavorite,
  updateFavoriteProductsOrder,
} from "../../../lib/products";

function buildStatusRedirect(pathname, status, message) {
  const params = new URLSearchParams({
    message,
    status,
  });

  return `${pathname}?${params.toString()}`;
}

function formatActionError(error) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid product data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createProductAction(_previousState, formData) {
  try {
    const payload = parseProductPayload(formData);
    await createProduct(payload);

    revalidatePath("/products");
    redirect(
      buildStatusRedirect(
        "/products",
        "success",
        "Product created successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}

export async function updateProductAction(productId, _previousState, formData) {
  try {
    const payload = parseProductPayload(formData);
    await updateProduct(productId, payload);

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    redirect(
      buildStatusRedirect(
        "/products",
        "success",
        "Product updated successfully.",
      ),
    );
  } catch (error) {
    unstable_rethrow(error);
    return { error: formatActionError(error) };
  }
}

export async function reorderProductsAction(orderedIds) {
  try {
    await updateProductsOrder(orderedIds);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder products:", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder products." };
  }
}

export async function toggleProductFavoriteAction(productId, favoriteStatus) {
  try {
    await toggleProductFavorite(productId, favoriteStatus);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle product favorite:", error);
    return { error: error instanceof Error ? error.message : "Failed to toggle product favorite." };
  }
}

export async function reorderFavoriteProductsAction(orderedIds) {
  try {
    await updateFavoriteProductsOrder(orderedIds);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder favorite products:", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder favorites." };
  }
}
