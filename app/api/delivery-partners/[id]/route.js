import { getDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const partner = await db.collection("delivery_partners").findOne({ _id: new ObjectId(id) });

    if (!partner) {
      return NextResponse.json({ success: false, error: "Delivery partner not found." }, { status: 404 });
    }

    const formatted = {
      id: partner._id.toString(),
      name: partner.name ?? "",
      code: partner.code ?? "",
      transitTime: partner.transitTime ?? "",
      price: partner.price ?? 0,
      active: !!partner.active,
      logo: partner.logo ?? "🚚",
    };

    return NextResponse.json({ success: true, partner: formatted });
  } catch (err) {
    console.error("Delivery Partner GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, transitTime, price, active, logo } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required." }, { status: 400 });
    }

    const db = await getDatabase();
    const updateDoc = {
      $set: {
        name: name.trim(),
        code: code?.trim().toLowerCase() || "",
        transitTime: transitTime?.trim() || "3-5 business days",
        price: Number(price) || 0,
        active: active !== false,
        logo: logo || "🚚",
        updatedAt: new Date(),
      }
    };

    const result = await db.collection("delivery_partners").updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Delivery partner not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delivery Partner PUT error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    const result = await db.collection("delivery_partners").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Delivery partner not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delivery Partner DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
