import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";
import { sendEmail } from "./email";

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
      <div style="border-top: 1px solid #ececec; padding-top: 20px; text-align: center; font-size: 11px; color: #0e10114d;">
        <p style="margin: 0;">This is an automated notification from Fjord. Please do not reply directly to this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Fjord Furnitures. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generateStatusEmail(status, order, options) {
  const customerName = order.customerName || "Customer";
  const orderNumber = order.orderNumber || `#FJ-${order.id.slice(-5).toUpperCase()}`;

  let subject = `Order ${orderNumber} Status Updated`;
  let title = `Your Order Status: ${status}`;
  let body = "";

  switch (status) {
    case "Accepted":
      subject = `Order ${orderNumber} Accepted`;
      title = "Your Order Has Been Accepted";
      body = `
        <p>Dear ${customerName},</p>
        <p>We are pleased to inform you that your order <strong>${orderNumber}</strong> has been accepted by our team and is now in the processing phase.</p>
        <p>We are preparing the items for shipment and will notify you as soon as they are dispatched.</p>
      `;
      break;

    case "Cancelled":
      subject = `Order ${orderNumber} Cancelled`;
      title = "Your Order Has Been Cancelled";
      body = `
        <p>Dear ${customerName},</p>
        <p>We regret to inform you that your order <strong>${orderNumber}</strong> has been cancelled.</p>
        <div style="background-color: #f6f6f6; border-left: 3px solid #d8ccb7; padding: 12px; margin: 15px 0; font-size: 13px; font-weight: 500; color: #0e1011;">
          <strong>Cancellation Reason:</strong><br/>
          ${options.comment || options.adminMessage || "No reason specified."}
        </div>
        <p>If you have any questions or require further assistance regarding this cancellation, please contact our support team.</p>
      `;
      break;

    case "Dispatched":
    case "Shipped":
      subject = `Order ${orderNumber} Dispatched`;
      title = "Your Order Has Been Dispatched!";
      body = `
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
        
        <div style="background-color: #f6f6f6; border-radius: 8px; padding: 12px; margin: 12px 0; border: 1px solid #ececec;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0e1011;">Shipment Details</h4>
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="color: #0e101199;"><strong>Courier:</strong></td>
              <td style="color: #0e1011; text-align: right;">${options.deliveryPartnerName || "Courier Services"}</td>
            </tr>
            <tr>
              <td style="color: #0e101199;"><strong>Tracking ID:</strong></td>
              <td style="color: #0e1011; font-family: monospace; text-align: right;">${options.trackingId || "N/A"}</td>
            </tr>
          </table>
        </div>

        ${(options.adminMessage || options.comment) ? `
        <p style="margin-top: 10px; font-size: 11px;"><strong>Message from Fjord team:</strong></p>
        <p style="background-color: #fcfbf9; border-left: 3px solid #d8ccb7; padding: 8px 12px; margin: 5px 0; font-style: italic; font-size: 12px; color: #0e1011;">
          "${options.adminMessage || options.comment}"
        </p>
        ` : ''}
      `;
      break;

    case "Delivered":
      subject = `Order ${orderNumber} Delivered`;
      title = "Your Order Has Been Delivered!";
      body = `
        <p>Dear ${customerName},</p>
        <p>Excellent news! Your order <strong>${orderNumber}</strong> has been successfully delivered.</p>
        <p>We hope you love your new furniture. Thank you for shopping with Fjord!</p>
      `;
      break;

    case "Refunded":
      subject = `Order ${orderNumber} Refunded`;
      title = "Your Order Has Been Refunded";
      body = `
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> has been refunded.</p>
        ${(options.adminMessage || options.comment) ? `
        <div style="background-color: #f6f6f6; border-left: 3px solid #d8ccb7; padding: 12px; margin: 15px 0; font-size: 13px; font-weight: 500; color: #0e1011;">
          <strong>Details:</strong><br/>
          ${options.adminMessage || options.comment}
        </div>
        ` : ''}
        <p>The refund will be credited back to your original payment method. If you have any questions, please contact our support team.</p>
      `;
      break;

    case "Processing":
      subject = `Order ${orderNumber} Processing`;
      title = "Your Order Has Been Updated to Processing";
      body = `
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> status has been updated to <strong>Processing</strong>.</p>
        <p>Our team is working on preparing your items. We will notify you once your order is accepted and shipped.</p>
      `;
      break;

    default:
      body = `
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
        ${(options.adminMessage || options.comment) ? `
        <div style="background-color: #f6f6f6; border-left: 3px solid #d8ccb7; padding: 12px; margin: 15px 0; font-size: 13px; font-weight: 500; color: #0e1011;">
          <strong>Details:</strong><br/>
          ${options.adminMessage || options.comment}
        </div>
        ` : ''}
      `;
  }

  return {
    subject,
    html: getEmailTemplate(title, body)
  };
}

export async function getOrdersCollection() {
  const database = await getDatabase();
  return database.collection("orders");
}

export async function listOrders() {
  const collection = await getOrdersCollection();
  const orders = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const db = await getDatabase();
  const userIds = orders.map((o) => o.userId).filter(Boolean);
  const users = await db.collection("users").find({ _id: { $in: userIds } }).toArray();
  const userMap = users.reduce((acc, u) => {
    acc[u._id.toString()] = u;
    return acc;
  }, {});

  return orders.map((order) => {
    const user = order.userId ? userMap[order.userId.toString()] : null;
    let customerName = "Customer";
    let customerEmail = "user@fjord.com";

    if (user) {
      customerEmail = user.email || customerEmail;
      customerName = user.name || customerName;
    }

    if (order.shippingAddress) {
      customerName = order.shippingAddress.fullName || order.shippingAddress.name || customerName;
      customerEmail = order.shippingAddress.email || customerEmail;
    }

    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber ?? `#FJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      customerName,
      customerEmail,
      total: order.total ?? 0,
      status: order.status ?? "Processing",
      createdAt: order.createdAt ?? new Date(),
      items: order.items || [],
    };
  });
}

export async function updateOrderStatus(orderId, status, options = {}) {
  const {
    trackingId = null,
    deliveryPartnerName = null,
    deliveryPartnerId = null,
    deliveryPartnerCode = null,
    adminMessage = null,
    comment = null
  } = options;

  const collection = await getOrdersCollection();
  const order = await collection.findOne({ _id: new ObjectId(orderId) });
  if (!order) return;

  // Initialize status timeline if not present
  let timeline = order.statusTimeline;
  if (!timeline) {
    timeline = [
      {
        status: "Processing",
        timestamp: order.createdAt || new Date(),
        comment: "Order placed successfully."
      }
    ];
    await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { statusTimeline: timeline } }
    );
  }

  const timelineEntry = {
    status,
    timestamp: new Date(),
    comment: comment || adminMessage || `Order status updated to ${status}.`
  };

  if (status === "Dispatched" || status === "Shipped") {
    timelineEntry.trackingId = trackingId;
    timelineEntry.deliveryPartnerName = deliveryPartnerName;
    timelineEntry.deliveryPartnerCode = deliveryPartnerCode;
  }

  const updateFields = {
    status,
    updatedAt: new Date(),
    adminMessage: adminMessage || order.adminMessage || null
  };

  if (status === "Dispatched" || status === "Shipped") {
    updateFields.trackingId = trackingId;
    updateFields.deliveryPartnerName = deliveryPartnerName;
    updateFields.deliveryPartnerId = deliveryPartnerId;
    updateFields.deliveryPartnerCode = deliveryPartnerCode;
  }

  await collection.updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: updateFields,
      $push: { statusTimeline: timelineEntry }
    }
  );

  // Send email notifications on status change
  try {
    const formattedOrder = await getOrder(orderId);
    if (formattedOrder) {
      // Send email to customer
      if (options.sendToUser !== false) {
        let emailSubject = options.emailSubject;
        let emailHtml = options.emailHtml;

        if (!emailHtml) {
          const emailContent = generateStatusEmail(status, formattedOrder, options);
          emailSubject = emailContent.subject;
          emailHtml = emailContent.html;
        }

        await sendEmail({
          to: formattedOrder.customerEmail,
          subject: emailSubject || `Order ${formattedOrder.orderNumber} Updated`,
          html: emailHtml,
          orderId: orderId.toString(),
        });
      }

      // Send admin copy if requested
      if (options.sendToAdmin === true) {
        const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@fjord.com";
        let emailSubject = options.emailSubject;
        let emailHtml = options.emailHtml;

        if (!emailHtml) {
          const emailContent = generateStatusEmail(status, formattedOrder, options);
          emailSubject = `[Admin Copy] ${emailContent.subject}`;
          emailHtml = emailContent.html;
        } else {
          emailSubject = `[Admin Copy] ${emailSubject || `Order ${formattedOrder.orderNumber} Updated`}`;
        }

        await sendEmail({
          to: adminEmail,
          subject: emailSubject,
          html: emailHtml,
          orderId: orderId.toString(),
        });
      }
    }
  } catch (err) {
    console.error("Failed to send order status update email notification:", err);
  }
}

export async function getOrder(idOrNumber) {
  const collection = await getOrdersCollection();
  let order = null;

  // 1. Try matching by ObjectId first
  try {
    if (idOrNumber && idOrNumber.length === 24) {
      order = await collection.findOne({ _id: new ObjectId(idOrNumber) });
    }
  } catch (e) {}

  // 2. Try matching by orderNumber (with or without '#')
  if (!order && idOrNumber) {
    const cleanNumber = idOrNumber.startsWith("#") ? idOrNumber : `#${idOrNumber}`;
    order = await collection.findOne({ orderNumber: cleanNumber });
  }

  // 3. Fallback to exact orderNumber match
  if (!order && idOrNumber) {
    order = await collection.findOne({ orderNumber: idOrNumber });
  }

  if (!order) return null;

  let customerEmail = "user@fjord.com";
  let customerName = "Customer";

  if (order.userId) {
    try {
      const db = await getDatabase();
      const user = await db.collection("users").findOne({ _id: new ObjectId(order.userId) });
      if (user) {
        customerEmail = user.email || customerEmail;
        customerName = user.name || customerName;
      }
    } catch (err) {
      console.error("Failed to fetch user details for order:", err);
    }
  }

  // Fallback to shipping address details if present
  if (order.shippingAddress) {
    customerName = order.shippingAddress.fullName || order.shippingAddress.name || customerName;
    customerEmail = order.shippingAddress.email || customerEmail;
  }

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? `#FJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    customerName,
    customerEmail,
    total: order.total ?? 0,
    status: order.status ?? "Processing",
    createdAt: order.createdAt ?? new Date(),
    items: order.items || [],
    shippingAddress: order.shippingAddress || null,
    trackingId: order.trackingId || null,
    deliveryPartnerName: order.deliveryPartnerName || null,
    deliveryPartnerId: order.deliveryPartnerId || null,
    adminMessage: order.adminMessage || null,
    statusTimeline: order.statusTimeline || [],
  };
}
