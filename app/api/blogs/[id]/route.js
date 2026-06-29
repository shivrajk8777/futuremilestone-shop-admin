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
    const db = await getDatabase();

    const objId = parseId(id);
    const blog = objId
      ? await db.collection("blogs").findOne({ _id: objId })
      : await db.collection("blogs").findOne({ slug: id });

    if (!blog) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: blog._id.toString(),
        slug: blog.slug,
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        image: blog.image,
        category: blog.category || "Design",
        readTime: blog.readTime || "5 min read",
        date: blog.date,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
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
    const { title, summary, content, image, category, readTime } = body;

    const db = await getDatabase();
    const now = new Date();

    await db.collection("blogs").updateOne(
      { _id: objId },
      {
        $set: {
          title: title?.trim(),
          summary: summary?.trim() || "",
          content: content,
          image: image || "",
          category: category || "Design",
          readTime: readTime || "5 min read",
          updatedAt: now,
        },
      },
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
    await db.collection("blogs").deleteOne({ _id: objId });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
