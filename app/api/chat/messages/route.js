import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { getCurrentAdminSession } from "../../../../lib/auth/session";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    // 1. Authenticate the admin
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection("chat_messages");

    // 2. Fetch all messages for this user
    const messages = await messagesCollection
      .find({ userId: userId })
      .sort({ timestamp: 1 })
      .toArray();

    // 3. Mark user's messages as read by admin
    await messagesCollection.updateMany(
      { userId: userId, sender: "user", readByAdmin: false },
      { $set: { readByAdmin: true } }
    );

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        userId: msg.userId,
        userName: msg.userName,
        userEmail: msg.userEmail,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        readByAdmin: true, // Since we just marked them as read
        readByUser: msg.readByUser,
      })),
    });
  } catch (error) {
    console.error("Admin chat messages GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // 1. Authenticate the admin
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, message } = await request.json();

    if (!userId || !message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "userId and message are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection("chat_messages");

    // 2. Find user info from previous messages or user collection
    let userName = "Customer";
    let userEmail = "";

    const lastMsg = await messagesCollection.findOne(
      { userId: userId },
      { sort: { timestamp: -1 } }
    );

    if (lastMsg) {
      userName = lastMsg.userName;
      userEmail = lastMsg.userEmail;
    } else {
      // Fallback to users collection if no messages exist yet
      try {
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user) {
          userName = user.name || "Customer";
          userEmail = user.email || "";
        }
      } catch (err) {
        console.error("Error looking up user in collection:", err);
      }
    }

    // 3. Insert new admin message
    const newMessage = {
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      sender: "admin",
      message: message.trim(),
      timestamp: new Date(),
      readByAdmin: true,
      readByUser: false,
    };

    const result = await messagesCollection.insertOne(newMessage);

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        ...newMessage,
      },
    });
  } catch (error) {
    console.error("Admin chat messages POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
