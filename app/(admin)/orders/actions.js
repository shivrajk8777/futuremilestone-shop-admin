"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus, getOrder } from "../../../lib/orders";
import { getDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function updateOrderStatusAction(orderId, formData) {
  const status = formData.get("status");
  if (!status) return;

  try {
    await updateOrderStatus(orderId, status);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
  } catch (error) {
    console.error("Failed to update order status:", error);
  }
}

export async function acceptOrderAction(orderId) {
  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const newStatus = "Accepted";
    await updateOrderStatus(orderId, newStatus, {
      comment: "Order has been accepted.",
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to accept order:", error);
    return { error: error.message || "Failed to accept order" };
  }
}

export async function cancelOrderAction(orderId, reason) {
  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const newStatus = "Cancelled";
    await updateOrderStatus(orderId, newStatus, {
      comment: `Order cancelled by Admin. Reason: ${reason || "No reason specified."}`,
      adminMessage: `Order cancelled. Reason: ${reason || "No reason specified."}`
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return { error: error.message || "Failed to cancel order" };
  }
}

export async function dispatchOrderAction(orderId, data) {
  try {
    const {
      trackingId,
      deliveryPartnerId,
      deliveryPartnerName,
      adminMessage,
      sendToUser,
      sendToAdmin,
      emailPreviewHtml,
    } = data;

    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const db = await getDatabase();
    let deliveryPartnerCode = "";
    if (deliveryPartnerId) {
      try {
        const partner = await db.collection("delivery_partners").findOne({ _id: new ObjectId(deliveryPartnerId) });
        if (partner) {
          deliveryPartnerCode = partner.code || "";
        }
      } catch (err) {
        console.error("Failed to fetch delivery partner code:", err);
      }
    }

    const newStatus = "Dispatched";
    await updateOrderStatus(orderId, newStatus, {
      trackingId,
      deliveryPartnerId,
      deliveryPartnerName,
      deliveryPartnerCode,
      adminMessage,
      comment: adminMessage || `Order dispatched via ${deliveryPartnerName} with tracking ID ${trackingId}.`,
      sendToUser,
      sendToAdmin,
      emailHtml: emailPreviewHtml,
      emailSubject: `Order ${order.orderNumber} Dispatched`,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to dispatch order:", error);
    return { error: error.message || "Failed to dispatch order" };
  }
}

export async function markDeliveredAction(orderId) {
  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const newStatus = "Delivered";
    await updateOrderStatus(orderId, newStatus, {
      comment: "Order has been successfully delivered to the customer.",
      adminMessage: "Delivered successfully."
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark order as delivered:", error);
    return { error: error.message || "Failed to update order to Delivered" };
  }
}
