import { Collection, Document, ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";
import { sendEmail } from "./email";

export interface StatusTimelineEntry {
  status: string;
  timestamp: Date;
  comment?: string;
  trackingId?: string | null;
  deliveryPartnerName?: string | null;
  deliveryPartnerCode?: string | null;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number | string;
  currency?: string;
  currencySymbol?: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string | null;
  createdAt: Date;
  items: any[];
}

export interface OrderDetail extends OrderItem {
  shippingAddress: any | null;
  trackingId: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerId: string | null;
  deliveryPartnerCode?: string | null;
  updatedAt?: Date | string;
  adminMessage: string | null;
  statusTimeline: StatusTimelineEntry[];
}

export interface UpdateOrderStatusOptions {
  trackingId?: string | null;
  deliveryPartnerName?: string | null;
  deliveryPartnerId?: string | null;
  deliveryPartnerCode?: string | null;
  adminMessage?: string | null;
  comment?: string | null;
  sendToUser?: boolean;
  sendToAdmin?: boolean;
  emailSubject?: string;
  emailHtml?: string;
}

// Helper to generate a modern Futuremilestone-branded HTML email
function getEmailTemplate(title: string, messageHtml: string): string {
  const logoUrl = "https://res.cloudinary.com/dhkf4qmql/image/upload/futuremilestone/futuremilestone_logo.png";
  return `
    <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ececec; border-radius: 16px; background-color: #ffffff; color: #0e1011;">
      <div style="text-align: center; border-bottom: 1px solid #ececec; padding-bottom: 20px; margin-bottom: 25px;">
        <img src="${logoUrl}" alt="Future Milestone" width="42" height="34" style="display: block; margin: 0 auto 10px auto; width: 42px; height: auto; border: 0;" />
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0e1011;">futuremilestone</h2>
      </div>
      <h3 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; color: #0e1011; letter-spacing: -0.01em;">${title}</h3>
      <div style="font-size: 14px; line-height: 1.6; color: #0e101199; margin-bottom: 25px;">
        ${messageHtml}
      </div>
      <div style="border-top: 1px solid #ececec; padding-top: 20px; text-align: center; font-size: 11px; color: #0e10114d;">
        <p style="margin: 0;">This is an automated notification from Future Milestone. Please do not reply directly to this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Futuremilestone Furnitures. All rights reserved.</p>
      </div>
    </div>
  `;
}

function formatOrderItemsTable(items: any[], currencySymbol = "₹"): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "";

  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://futuremilestone.shop";

  const rows = items
    .map((item) => {
      const rawImg = item.image || item.imageUrl || item.thumbnail;
      let imgUrl = "https://res.cloudinary.com/dhkf4qmql/image/upload/futuremilestone/futuremilestone_logo.png";
      if (rawImg) {
        if (rawImg.startsWith("http://") || rawImg.startsWith("https://")) {
          imgUrl = rawImg;
        } else {
          imgUrl = `${storeUrl.replace(/\/$/, "")}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;
        }
      }

      const name = item.name || item.title || "Product";
      const specs = [item.material, item.dimension, item.selectedVariant].filter(Boolean).join(" • ");
      const qty = item.quantity || 1;
      const priceNum =
        typeof item.price === "number"
          ? item.price
          : parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
      const totalNum = priceNum * qty;

      const formattedPrice = priceNum
        ? `${currencySymbol}${priceNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "";
      const formattedTotal = totalNum
        ? `${currencySymbol}${totalNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "";

      return `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 8px; vertical-align: middle; width: 64px;">
            <img src="${imgUrl}" alt="${name}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #eeeeee; display: block;" />
          </td>
          <td style="padding: 12px 8px; vertical-align: middle;">
            <div style="font-weight: 600; font-size: 14px; color: #0e1011; line-height: 1.3;">${name}</div>
            ${specs ? `<div style="font-size: 11px; color: #0e101180; margin-top: 3px; line-height: 1.3;">${specs}</div>` : ""}
          </td>
          <td style="padding: 12px 8px; vertical-align: middle; text-align: center; font-size: 13px; color: #0e101199; font-weight: 500;">
            ${qty}
          </td>
          <td style="padding: 12px 8px; vertical-align: middle; text-align: right; font-size: 13px; color: #0e101199; font-weight: 500; white-space: nowrap;">
            ${formattedPrice}
          </td>
          <td style="padding: 12px 8px; vertical-align: middle; text-align: right; font-size: 13.5px; color: #0e1011; font-weight: 700; white-space: nowrap;">
            ${formattedTotal}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin: 20px 0; background-color: #fafafa; border: 1px solid #ececec; border-radius: 12px; padding: 16px; overflow: hidden;">
      <h4 style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0e101199;">Ordered Items</h4>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1.5px solid #ececec; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #0e101166;">
            <th style="padding: 0 8px 8px 8px;" colspan="2">Item</th>
            <th style="padding: 0 8px 8px 8px; text-align: center;">Qty</th>
            <th style="padding: 0 8px 8px 8px; text-align: right;">Price</th>
            <th style="padding: 0 8px 8px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function generateStatusEmail(status: string, order: OrderDetail, options: UpdateOrderStatusOptions) {
  const customerName = order.customerName || "Customer";
  const orderNumber = order.orderNumber || `#FM-${order.id.slice(-5).toUpperCase()}`;

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

    case "Cancelled": {
      const cleanReason = (options.comment || options.adminMessage || "No reason specified.")
        .replace(/^Order cancelled by [^.]*\.\s*Reason:\s*/i, "")
        .replace(/^Order cancelled\.\s*Reason:\s*/i, "");

      subject = `Order ${orderNumber} Cancelled`;
      title = "Your Order Has Been Cancelled";
      body = `
        <p>Dear ${customerName},</p>
        <p>We regret to inform you that your order <strong>${orderNumber}</strong> has been cancelled.</p>
        <p style="margin: 15px 0; font-size: 13.5px; color: #0e1011; line-height: 1.5;">
          <strong>Cancellation Reason:</strong> ${cleanReason}
        </p>
        <p>If you have any questions or require further assistance regarding this cancellation, please contact our support team.</p>
      `;
      break;
    }

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
        <p style="margin-top: 10px; font-size: 11px;"><strong>Message from Futuremilestone team:</strong></p>
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
        <p>We hope you love your new furniture. Thank you for shopping with Futuremilestone!</p>
      `;
      break;

    case "Out for Delivery":
      subject = `Order ${orderNumber} is Out for Delivery!`;
      title = "Your Order is Out for Delivery!";
      body = `
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> is out for delivery today and will be arriving shortly.</p>
        <div style="background-color: #f6f6f6; border-radius: 8px; padding: 12px; margin: 12px 0; border: 1px solid #ececec;">
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="color: #0e101199;"><strong>Courier:</strong></td>
              <td style="color: #0e1011; text-align: right;">${options.deliveryPartnerName || order.deliveryPartnerName || "Courier Services"}</td>
            </tr>
            <tr>
              <td style="color: #0e101199;"><strong>Tracking ID:</strong></td>
              <td style="color: #0e1011; font-family: monospace; text-align: right;">${options.trackingId || order.trackingId || "N/A"}</td>
            </tr>
          </table>
        </div>
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

  const itemsTableHtml = formatOrderItemsTable(order.items, order.currencySymbol || "₹");
  const formattedTotal = order.total
    ? typeof order.total === "number"
      ? `${order.currencySymbol || "₹"}${order.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : order.total
    : "";

  const fullBody = `
    ${body}
    ${itemsTableHtml}
    ${formattedTotal ? `<div style="text-align: right; font-size: 14.5px; font-weight: 700; color: #0e1011; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ececec;">Total Amount: <span style="font-size: 16px; color: #0e1011;">${formattedTotal}</span></div>` : ""}
  `;

  return {
    subject,
    html: getEmailTemplate(title, fullBody)
  };
}

export async function getOrdersCollection(): Promise<Collection<Document>> {
  const database = await getDatabase();
  return database.collection("orders");
}

export function normalizeShippingAddress(rawAddr: any, fallbackName?: string, fallbackEmail?: string) {
  if (!rawAddr) return null;

  if (typeof rawAddr === "string") {
    return {
      name: fallbackName || "Customer",
      fullName: fallbackName || "Customer",
      addressLine: rawAddr,
      phone: "",
      email: fallbackEmail || "",
    };
  }

  const name = rawAddr.fullName || rawAddr.name || fallbackName || "Customer";
  const phone = rawAddr.phone || rawAddr.contact || "";
  const email = rawAddr.email || fallbackEmail || "";
  const label = rawAddr.label || "";

  let addressLine = rawAddr.addressLine;

  if (!addressLine) {
    const parts = [
      rawAddr.flat,
      rawAddr.area,
      rawAddr.landmark ? (rawAddr.landmark.toLowerCase().startsWith("near") ? rawAddr.landmark : `Near ${rawAddr.landmark}`) : "",
      rawAddr.city,
      rawAddr.state,
      rawAddr.pincode && rawAddr.country ? `${rawAddr.pincode}, ${rawAddr.country}` : (rawAddr.pincode || rawAddr.country),
    ].filter(Boolean);

    addressLine = parts.length > 0 ? parts.join(", ") : "";
  }

  return {
    ...rawAddr,
    name,
    fullName: name,
    addressLine,
    phone,
    email,
    label,
  };
}

export function normalizeOrderCurrencyAndItems(orderDoc: any) {
  const rawTotal = orderDoc.total;
  let currencySymbol = orderDoc.currencySymbol;
  let currency = orderDoc.currency;

  if (typeof rawTotal === "string") {
    const symbolMatch = rawTotal.match(/^([₹$€£₨৳])/);
    if (symbolMatch && !currencySymbol) {
      currencySymbol = symbolMatch[1];
    }
  }

  if (!currencySymbol) {
    if (currency === "INR") currencySymbol = "₹";
    else if (currency === "EUR") currencySymbol = "€";
    else if (currency === "GBP") currencySymbol = "£";
    else currencySymbol = "$";
  }

  if (!currency) {
    if (currencySymbol === "₹") currency = "INR";
    else if (currencySymbol === "€") currency = "EUR";
    else if (currencySymbol === "£") currency = "GBP";
    else currency = "USD";
  }

  let items = (orderDoc.items || []).map((item: any) => ({ ...item }));

  if (items.length > 0) {
    const baseSubtotal = items.reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const cleanTotalNum =
      typeof rawTotal === "number"
        ? rawTotal
        : Number(String(rawTotal).replace(/[^0-9.-]+/g, ""));

    if (baseSubtotal > 0 && !isNaN(cleanTotalNum) && cleanTotalNum > 0) {
      const ratio = cleanTotalNum / baseSubtotal;

      if (Math.abs(ratio - 1) > 0.15) {
        items = items.map((item: any) => ({
          ...item,
          price: Number(((Number(item.price) || 0) * ratio).toFixed(2)),
        }));
      }
    }
  }

  return { currency, currencySymbol, items };
}

export async function listOrders(): Promise<OrderItem[]> {
  const collection = await getOrdersCollection();
  const orders = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const db = await getDatabase();
  const userIds = orders.map((o) => o.userId).filter(Boolean);
  const users = await db.collection("users").find({ _id: { $in: userIds } }).toArray();
  const userMap = users.reduce((acc: Record<string, any>, u) => {
    acc[u._id.toString()] = u;
    return acc;
  }, {});

  return orders.map((order) => {
    const user = order.userId ? userMap[order.userId.toString()] : null;
    let customerName = "Customer";
    let customerEmail = "user@futuremilestone.com";

    if (user) {
      customerEmail = user.email || customerEmail;
      customerName = user.name || customerName;
    }

    if (order.shippingAddress) {
      customerName = order.shippingAddress.fullName || order.shippingAddress.name || customerName;
      customerEmail = order.shippingAddress.email || customerEmail;
    }

    const dateObj = new Date(order.createdAt || Date.now());
    const yy = dateObj.getFullYear().toString().slice(-2);
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = dateObj.getDate().toString().padStart(2, '0');
    const fallbackNum = `FM${yy}${mm}${dd}${(1 + parseInt(order._id.toString().slice(-3), 16) % 999).toString().padStart(3, '0')}`;

    const transactionId =
      order.razorpayPaymentId ||
      order.paypalCaptureId ||
      order.transactionId ||
      order.paymentId ||
      order.paypalOrderId ||
      order.razorpayOrderId ||
      null;

    const { currency, currencySymbol, items } = normalizeOrderCurrencyAndItems(order);

    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber || fallbackNum,
      customerName,
      customerEmail,
      total: order.total ?? 0,
      currency,
      currencySymbol,
      status: order.status ?? "Processing",
      paymentMethod: order.paymentMethod || order.payment_method || order.paymentType || "Online",
      transactionId,
      createdAt: order.createdAt ?? new Date(),
      items,
    };
  });
}

export async function updateOrderStatus(orderId: string, status: string, options: UpdateOrderStatusOptions = {}): Promise<void> {
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

  const timelineEntry: StatusTimelineEntry = {
    status,
    timestamp: new Date(),
    comment: comment || adminMessage || `Order status updated to ${status}.`
  };

  if (status === "Dispatched" || status === "Shipped") {
    timelineEntry.trackingId = trackingId;
    timelineEntry.deliveryPartnerName = deliveryPartnerName;
    timelineEntry.deliveryPartnerCode = deliveryPartnerCode;
  }

  const updateFields: Record<string, any> = {
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
      $push: { statusTimeline: timelineEntry } as any,
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
          html: emailHtml!,
          orderId: orderId.toString(),
        });
      }

      // Send admin copy if requested
      if (options.sendToAdmin === true) {
        const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@futuremilestone.com";
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
          subject: emailSubject!,
          html: emailHtml!,
          orderId: orderId.toString(),
        });
      }
    }
  } catch (err) {
    console.error("Failed to send order status update email notification:", err);
  }
}

export async function getOrder(idOrNumber: string): Promise<OrderDetail | null> {
  const collection = await getOrdersCollection();
  let order: Document | null = null;

  // 1. Try matching by ObjectId first
  try {
    if (idOrNumber && idOrNumber.length === 24) {
      order = await collection.findOne({ _id: new ObjectId(idOrNumber) });
    }
  } catch (e) { }

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

  let customerEmail = "user@futuremilestone.com";
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

  const shippingAddress = normalizeShippingAddress(order.shippingAddress, customerName, customerEmail);

  // Fallback to shipping address details if present
  if (shippingAddress) {
    customerName = shippingAddress.fullName || shippingAddress.name || customerName;
    customerEmail = shippingAddress.email || customerEmail;
  }

  const dateObj = new Date(order.createdAt || Date.now());
  const yy = dateObj.getFullYear().toString().slice(-2);
  const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const dd = dateObj.getDate().toString().padStart(2, '0');
  const fallbackNum = `FM${yy}${mm}${dd}${(1 + parseInt(order._id.toString().slice(-3), 16) % 999).toString().padStart(3, '0')}`;

  const transactionId =
    order.razorpayPaymentId ||
    order.paypalCaptureId ||
    order.transactionId ||
    order.paymentId ||
    order.paypalOrderId ||
    order.razorpayOrderId ||
    null;

  const { currency, currencySymbol, items } = normalizeOrderCurrencyAndItems(order);

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber || fallbackNum,
    customerName,
    customerEmail,
    total: order.total ?? 0,
    currency,
    currencySymbol,
    status: order.status ?? "Processing",
    paymentMethod: order.paymentMethod || order.payment_method || order.paymentType || "Online",
    transactionId,
    createdAt: order.createdAt ?? new Date(),
    items,
    shippingAddress,
    trackingId: order.trackingId || null,
    deliveryPartnerName: order.deliveryPartnerName || null,
    deliveryPartnerId: order.deliveryPartnerId || null,
    adminMessage: order.adminMessage || null,
    statusTimeline: order.statusTimeline || [],
  };
}
