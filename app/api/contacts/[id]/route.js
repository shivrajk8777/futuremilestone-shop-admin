import { getDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/email";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
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
    const { subject, replyMessage } = body;

    if (!subject || !replyMessage) {
      return NextResponse.json({ success: false, error: "Subject and reply message are required." }, { status: 400 });
    }

    const db = await getDatabase();
    const contact = await db.collection("contacts").findOne({ _id: objId });
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact inquiry not found." }, { status: 404 });
    }

    // Build reply email HTML
    const emailHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Future Milestone Support</h2>
        <p style="font-size: 15px; font-weight: 500; color: #0f172a;">Hi ${contact.name},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Thank you for reaching out to us. Below is our response regarding your inquiry:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
          <small style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">Your Message:</small>
          <p style="font-size: 13.5px; line-height: 1.5; color: #334155; font-style: italic; margin: 0;">"${contact.message}"</p>
        </div>

        <div style="font-size: 14px; line-height: 1.6; color: #1e293b; margin: 24px 0 30px; white-space: pre-wrap; font-weight: 500;">${replyMessage}</div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
          <p style="margin: 0 0 4px;">Future Milestone Scandinavian Furniture Studio</p>
          <p style="margin: 0;"><a href="https://futuremilestone.shop" style="color: #6366f1; text-decoration: none; font-weight: 600;">futuremilestone.shop</a></p>
        </div>
      </div>
    `;

    // Dispatch SMTP or simulated Nodemailer log
    const emailResult = await sendEmail({
      to: contact.email,
      subject: subject.trim(),
      html: emailHtml,
    });

    if (!emailResult.success) {
      return NextResponse.json({ success: false, error: emailResult.error || "SMTP dispatch failed." }, { status: 500 });
    }

    // Save reply log inside dynamic replies log array in contacts collection
    const replyObj = {
      subject: subject.trim(),
      message: replyMessage.trim(),
      sentAt: new Date(),
    };

    await db.collection("contacts").updateOne(
      { _id: objId },
      {
        $push: { replies: replyObj }
      }
    );

    return NextResponse.json({ success: true, reply: replyObj });
  } catch (err) {
    console.error("Contact reply error:", err);
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
    await db.collection("contacts").deleteOne({ _id: objId });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
