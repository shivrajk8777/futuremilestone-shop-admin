import { getDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const objId = parseId(id);
    if (!objId) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    const db = await getDatabase();
    const member = await db.collection("team").findOne({ _id: objId });

    if (!member) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member._id.toString(),
        name: member.name,
        role: member.role,
        image: member.image,
        socials: member.socials || { twitter: "#", instagram: "#", behance: "#" },
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const objId = parseId(id);
    if (!objId) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const { name, role, image, socials } = body;

    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Name and role are required." }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    await db.collection("team").updateOne(
      { _id: objId },
      {
        $set: {
          name: name.trim(),
          role: role.trim(),
          image: image || "",
          socials: socials || { twitter: "#", instagram: "#", behance: "#" },
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const objId = parseId(id);
    if (!objId) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    const db = await getDatabase();
    await db.collection("team").deleteOne({ _id: objId });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
