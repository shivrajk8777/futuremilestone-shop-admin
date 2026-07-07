import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

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

  return orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? `#FJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    customerName: order.shippingAddress?.name || "Customer",
    customerEmail: order.items?.[0]?.customerName || order.shippingAddress?.email || "user@fjord.com",
    total: order.total ?? 0,
    status: order.status ?? "Processing",
    createdAt: order.createdAt ?? new Date(),
    items: order.items || [],
  }));
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

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? `#FJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    customerName: order.shippingAddress?.name || "Customer",
    customerEmail: order.shippingAddress?.email || order.items?.[0]?.customerEmail || order.items?.[0]?.customerName || "user@fjord.com",
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
