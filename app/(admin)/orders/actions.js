"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus } from "../../../lib/orders";

export async function updateOrderStatusAction(orderId, formData) {
  const status = formData.get("status");

  if (!status) {
    return;
  }

  try {
    await updateOrderStatus(orderId, status);
    revalidatePath("/orders");
  } catch (error) {
    console.error("Failed to update order status:", error);
  }
}
