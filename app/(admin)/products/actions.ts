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

export interface ProductActionState {
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
    return error.issues[0]?.message ?? "Invalid product data.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createProductAction(_previousState: ProductActionState, formData: FormData): Promise<ProductActionState> {
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

export async function updateProductAction(productId: string, _previousState: ProductActionState, formData: FormData): Promise<ProductActionState> {
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

export async function reorderProductsAction(orderedIds: string[]): Promise<{ success?: boolean; error?: string }> {
  try {
    await updateProductsOrder(orderedIds);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder products:", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder products." };
  }
}

export async function toggleProductFavoriteAction(productId: string, favoriteStatus: boolean): Promise<{ success?: boolean; error?: string }> {
  try {
    await toggleProductFavorite(productId, favoriteStatus);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle product favorite:", error);
    return { error: error instanceof Error ? error.message : "Failed to toggle product favorite." };
  }
}

export async function reorderFavoriteProductsAction(orderedIds: string[]): Promise<{ success?: boolean; error?: string }> {
  try {
    await updateFavoriteProductsOrder(orderedIds);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder favorite products:", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder favorites." };
  }
}
