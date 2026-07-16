import { getDatabase } from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    const team = await db
      .collection("team")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    const formatted = team.map((member) => ({
      id: member._id.toString(),
      name: member.name ?? "",
      role: member.role ?? "",
      image: member.image ?? "",
      socials: member.socials ?? { twitter: "#", instagram: "#", behance: "#" },
    }));

    return NextResponse.json({ success: true, team: formatted });
  } catch (err) {
    console.error("Team GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, role, image, socials } = body;

    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Name and role are required." }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    const doc = {
      name: name.trim(),
      role: role.trim(),
      image: image?.trim() || "",
      socials: socials || { twitter: "#", instagram: "#", behance: "#" },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("team").insertOne(doc);

    return NextResponse.json({
      success: true,
      member: { id: result.insertedId.toString(), ...doc },
    });
  } catch (err) {
    console.error("Team POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
