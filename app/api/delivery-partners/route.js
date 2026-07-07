import { getDatabase } from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();
    const partners = await db
      .collection("delivery_partners")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = partners.map((p) => ({
      id: p._id.toString(),
      name: p.name ?? "",
      code: p.code ?? "",
      transitTime: p.transitTime ?? "",
      price: p.price ?? 0,
      active: !!p.active,
      logo: p.logo ?? "🚚",
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ success: true, partners: formatted });
  } catch (err) {
    console.error("Delivery Partners GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, transitTime, price, active, logo } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required." }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();
    const doc = {
      name: name.trim(),
      code: code?.trim().toLowerCase() || "",
      transitTime: transitTime?.trim() || "3-5 business days",
      price: Number(price) || 0,
      active: active !== false,
      logo: logo || "🚚",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("delivery_partners").insertOne(doc);

    return NextResponse.json({
      success: true,
      partner: { id: result.insertedId.toString(), ...doc },
    });
  } catch (err) {
    console.error("Delivery Partners POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
