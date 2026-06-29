import { getDatabase } from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();
    const blogs = await db
      .collection("blogs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = blogs.map((b) => ({
      id: b._id.toString(),
      slug: b.slug ?? "",
      title: b.title ?? "",
      summary: b.summary ?? "",
      content: b.content ?? "",
      image: b.image ?? "",
      category: b.category ?? "Design",
      readTime: b.readTime ?? "5 min read",
      date: b.date ?? new Date(b.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ success: true, blogs: formatted });
  } catch (err) {
    console.error("Blogs GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, summary, content, image, category, readTime } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required." }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const db = await getDatabase();

    // Ensure slug is unique
    const existing = await db.collection("blogs").findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const now = new Date();
    const doc = {
      slug: finalSlug,
      title: title.trim(),
      summary: summary?.trim() || "",
      content: content,
      image: image || "",
      category: category || "Design",
      readTime: readTime || "5 min read",
      date: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("blogs").insertOne(doc);

    return NextResponse.json({
      success: true,
      blog: { id: result.insertedId.toString(), ...doc },
    });
  } catch (err) {
    console.error("Blogs POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
