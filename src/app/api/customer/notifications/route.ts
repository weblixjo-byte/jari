import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
    }

    const notifications = await dbService.getNotifications(session.userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
    }

    await dbService.markNotificationsRead(session.userId);
    return NextResponse.json({ success: true, message: "Notifications marked as read" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
