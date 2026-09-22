import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, keys, customerId } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: "Invalid push subscription object" }, { status: 400 });
    }

    const session = await getSession(req);
    let userId = session?.userId || null;

    if (!userId) {
      const fallbackCustomerId = req.headers.get("x-customer-id") || customerId;
      if (fallbackCustomerId) {
        const candidate = await dbService.findUserById(fallbackCustomerId);
        if (candidate) {
          userId = candidate._id;
        }
      }
    }

    // Fallback: If no user found, associate with the most recent customer or store as device
    if (!userId) {
      try {
        const topCustomers = await dbService.getTopCustomers(1);
        if (topCustomers && topCustomers.length > 0) {
          userId = topCustomers[0]._id;
        }
      } catch {
        // Ignore
      }
    }

    if (!userId) {
      userId = "device_" + Math.random().toString(36).substring(2, 10);
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    const sub = await dbService.savePushSubscription({
      userId,
      endpoint,
      keys,
      userAgent,
    });

    console.log(`[PushSubscription] Saved device subscription in MongoDB Atlas for user ${userId}`);

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (endpoint) {
      await dbService.deletePushSubscription(endpoint);
    }

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
