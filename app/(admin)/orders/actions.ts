"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus, getOrder } from "../../../lib/orders";
import { getDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function updateOrderStatusAction(orderId: string, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const status = formData.get("status");
  const reason = formData.get("reason");
  if (!status || typeof status !== "string") return { error: "Invalid status" };

  try {
    const options: any = {};
    if (reason && typeof reason === "string" && reason.trim()) {
      options.comment = status === "Cancelled" ? `Order cancelled by future milestone. Reason: ${reason.trim()}` : reason.trim();
      options.adminMessage = status === "Cancelled" ? `Order cancelled. Reason: ${reason.trim()}` : reason.trim();
    }
    await updateOrderStatus(orderId, status, options);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return { error: error.message || "Failed to update order status" };
  }
}

export async function acceptOrderAction(orderId: string): Promise<{ success?: boolean; error?: string }> {
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
  } catch (error: any) {
    console.error("Failed to accept order:", error);
    return { error: error.message || "Failed to accept order" };
  }
}

export async function cancelOrderAction(orderId: string, reason: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const newStatus = "Cancelled";
    await updateOrderStatus(orderId, newStatus, {
      comment: `Order cancelled by future milestone. Reason: ${reason || "No reason specified."}`,
      adminMessage: `Order cancelled. Reason: ${reason || "No reason specified."}`
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to cancel order:", error);
    return { error: error.message || "Failed to cancel order" };
  }
}

export async function refundOrderAction(
  orderId: string,
  data?: { reason?: string; refundTxnId?: string }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const reason = data?.reason?.trim() || "Full refund processed by future milestone.";
    const refundTxnId = data?.refundTxnId?.trim() || "";
    const newStatus = "Refunded";

    const refundNote = refundTxnId
      ? `${reason} (Ref TXN: ${refundTxnId})`
      : reason;

    const db = await getDatabase();
    if (orderId && orderId.length === 24) {
      await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            refundedAt: new Date(),
            refundTxnId: refundTxnId || null,
            refundReason: reason,
          },
        }
      );
    }

    await updateOrderStatus(orderId, newStatus, {
      comment: refundNote,
      adminMessage: refundNote,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to process refund:", error);
    return { error: error.message || "Failed to process refund" };
  }
}

export interface DispatchData {
  trackingId: string;
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  adminMessage: string;
  sendToUser: boolean;
  sendToAdmin: boolean;
  emailPreviewHtml: string;
}

export async function dispatchOrderAction(orderId: string, data: DispatchData): Promise<{ success?: boolean; error?: string }> {
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
  } catch (error: any) {
    console.error("Failed to dispatch order:", error);
    return { error: error.message || "Failed to dispatch order" };
  }
}

export async function markDeliveredAction(orderId: string): Promise<{ success?: boolean; error?: string }> {
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
  } catch (error: any) {
    console.error("Failed to mark order as delivered:", error);
    return { error: error.message || "Failed to update order to Delivered" };
  }
}
