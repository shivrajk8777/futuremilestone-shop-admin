"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus, getOrder } from "../../../lib/orders";
import { sendEmail } from "../../../lib/email";
import { getDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Helper to generate a modern Fjords-branded HTML email
function getEmailTemplate(title, messageHtml) {
  return `
    <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ececec; border-radius: 16px; background-color: #ffffff; color: #0e1011;">
      <div style="text-align: center; border-bottom: 1px solid #ececec; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0e1011;">fjord</h2>
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #0e101199; display: block; margin-top: 4px;">Future Milestone</span>
      </div>
      <h3 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; color: #0e1011; letter-spacing: -0.01em;">${title}</h3>
      <div style="font-size: 14px; line-height: 1.6; color: #0e101199; margin-bottom: 25px;">
        ${messageHtml}
      </div>
      <div style="border-t: 1px solid #ececec; padding-top: 20px; text-align: center; font-size: 11px; color: #0e10114d;">
        <p style="margin: 0;">This is an automated notification from Fjord. Please do not reply directly to this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Fjord Furnitures. All rights reserved.</p>
      </div>
    </div>
  `;
}

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
      comment: "Order has been accepted by Fjord Admin.",
    });

    // Send email to user
    const emailSubject = `Order ${order.orderNumber} Accepted`;
    const emailHtml = getEmailTemplate(
      "Your Order Has Been Accepted",
      `
        <p>Dear ${order.customerName},</p>
        <p>We are pleased to inform you that your order <strong>${order.orderNumber}</strong> has been accepted by our team and is now in the processing phase.</p>
        <p>We are preparing the items for shipment and will notify you as soon as they are dispatched.</p>
      `
    );

    await sendEmail({
      to: order.customerEmail,
      subject: emailSubject,
      html: emailHtml,
      orderId,
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

    // Send email to user
    const emailSubject = `Order ${order.orderNumber} Cancelled`;
    const emailHtml = getEmailTemplate(
      "Your Order Has Been Cancelled",
      `
        <p>Dear ${order.customerName},</p>
        <p>We regret to inform you that your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
        <div style="background-color: #f6f6f6; border-left: 3px solid #d8ccb7; padding: 12px; margin: 15px 0; font-size: 13px; font-weight: 500; color: #0e1011;">
          <strong>Cancellation Reason:</strong><br/>
          ${reason || "No reason specified."}
        </div>
        <p>If you have any questions or require further assistance regarding this cancellation, please contact our support team.</p>
      `
    );

    await sendEmail({
      to: order.customerEmail,
      subject: emailSubject,
      html: emailHtml,
      orderId,
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
    });

    // Send email to user if requested
    if (sendToUser) {
      await sendEmail({
        to: order.customerEmail,
        subject: `Order ${order.orderNumber} Dispatched`,
        html: emailPreviewHtml,
        orderId,
      });
    }

    // Send email to admin self if requested
    if (sendToAdmin) {
      const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@fjord.com";
      await sendEmail({
        to: adminEmail,
        subject: `[Admin Copy] Order ${order.orderNumber} Dispatched`,
        html: emailPreviewHtml,
        orderId,
      });
    }

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

    // Send email to user
    const emailSubject = `Order ${order.orderNumber} Delivered`;
    const emailHtml = getEmailTemplate(
      "Your Order Has Been Delivered!",
      `
        <p>Dear ${order.customerName},</p>
        <p>Excellent news! Your order <strong>${order.orderNumber}</strong> has been successfully delivered.</p>
        <p>We hope you love your new furniture. Thank you for shopping with Fjord!</p>
      `
    );

    await sendEmail({
      to: order.customerEmail,
      subject: emailSubject,
      html: emailHtml,
      orderId,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark order as delivered:", error);
    return { error: error.message || "Failed to update order to Delivered" };
  }
}
