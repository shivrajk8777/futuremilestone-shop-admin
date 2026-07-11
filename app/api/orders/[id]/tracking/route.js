import { getDatabase } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "../../../../../lib/auth/session";
import { trackShipment } from "../../../../../lib/tracking-providers";

export async function GET(request, { params }) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let orderObjId;
    try {
      orderObjId = new ObjectId(id);
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid order ID format." }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ _id: orderObjId });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    if (!order.trackingId) {
      return NextResponse.json({ success: true, tracking: null });
    }

    // Determine the dispatch time from status timeline
    const dispatchEntry = (order.statusTimeline || []).find(
      (t) => t.status === "Dispatched" || t.status === "Shipped"
    );
    const dispatchTime = dispatchEntry ? new Date(dispatchEntry.timestamp) : new Date(order.updatedAt || order.createdAt || Date.now());

    // Call tracking provider registry
    const partnerCode = order.deliveryPartnerCode || "";
    const trackingDetails = await trackShipment(partnerCode, order.trackingId, dispatchTime);

    return NextResponse.json({
      success: true,
      tracking: trackingDetails
    });
  } catch (error) {
    console.error("Admin fetch tracking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
