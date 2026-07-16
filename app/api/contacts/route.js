import { getDatabase } from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    const contacts = await db
      .collection("contacts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = contacts.map((c) => ({
      id: c._id.toString(),
      name: c.name ?? "",
      email: c.email ?? "",
      message: c.message ?? "",
      createdAt: c.createdAt,
      replies: c.replies ?? [],
    }));

    return NextResponse.json({ success: true, contacts: formatted });
  } catch (err) {
    console.error("Contacts GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
