import { getDatabase } from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db
      .collection("collections")
      .find({})
      .toArray();

    const formatted = collections.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    }));

    return NextResponse.json({ success: true, collections: formatted });
  } catch (err) {
    console.error("Collections GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
