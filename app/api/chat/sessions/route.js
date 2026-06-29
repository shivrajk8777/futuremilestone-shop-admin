import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { getCurrentAdminSession } from "../../../../lib/auth/session";

export async function GET() {
  try {
    // 1. Authenticate the admin
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection("chat_messages");

    // 2. Aggregate sessions
    const sessions = await messagesCollection
      .aggregate([
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: "$userId",
            userId: { $first: "$userId" },
            userName: { $first: "$userName" },
            userEmail: { $first: "$userEmail" },
            latestMessage: { $first: "$message" },
            latestTimestamp: { $first: "$timestamp" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$sender", "user"] },
                      { $eq: ["$readByAdmin", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { latestTimestamp: -1 },
        },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        userId: s.userId,
        userName: s.userName || "Customer",
        userEmail: s.userEmail || "",
        latestMessage: s.latestMessage,
        latestTimestamp: s.latestTimestamp,
        unreadCount: s.unreadCount,
      })),
    });
  } catch (error) {
    console.error("Admin chat sessions GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
