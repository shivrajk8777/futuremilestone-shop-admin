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

export async function updateOrderStatus(orderId, status) {
  const collection = await getOrdersCollection();
  await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status, updatedAt: new Date() } }
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
    customerEmail: order.items?.[0]?.customerName || order.shippingAddress?.email || "user@fjord.com",
    total: order.total ?? 0,
    status: order.status ?? "Processing",
    createdAt: order.createdAt ?? new Date(),
    items: order.items || [],
    shippingAddress: order.shippingAddress || null,
  };
}
