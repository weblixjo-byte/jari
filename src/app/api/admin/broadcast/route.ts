import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { sendWebPushToSubscriptions } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const { title, message, bonusPoints, audience = "all", targetCustomerId } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Notification title and message are required" }, { status: 400 });
    }

    if (audience === "single" && !targetCustomerId) {
      return NextResponse.json({ error: "Target customer must be selected" }, { status: 400 });
    }

    const bonus = Number(bonusPoints) || 0;
    let bonusCreditedCount = 0;

    // 1. Single customer targeting
    if (audience === "single") {
      const targetUser = await dbService.findUserById(targetCustomerId);
      if (!targetUser) {
        return NextResponse.json({ error: "Target customer not found" }, { status: 404 });
      }

      const notif = await dbService.createNotification({
        customerId: targetUser._id,
        title: title.trim(),
        message: message.trim(),
        type: bonus > 0 ? "POINTS_EARNED" : "BROADCAST",
      });

      if (bonus > 0) {
        const newBalance = (targetUser.pointsBalance || 0) + bonus;
        const newLifetime = (targetUser.lifetimePoints || 0) + bonus;
        await dbService.updateUser(targetUser._id, {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
        });

        await dbService.createTransaction({
          type: "EARN",
          customerId: targetUser._id,
          customerName: targetUser.name,
          customerPhone: targetUser.phone,
          billAmount: 0,
          points: bonus,
          balanceAfter: newBalance,
          referenceCode: `NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Targeted Promo: ${title}`,
        });
        bonusCreditedCount = 1;
      }

      // Dispatch real Web Push to customer's active devices
      const targetSubs = await dbService.getPushSubscriptionsForUser(targetUser._id);
      const pushDevicesSent = await sendWebPushToSubscriptions(targetSubs, {
        title: title.trim(),
        body: bonus > 0 ? `${message.trim()} (+${bonus} bonus points added to your balance!)` : message.trim(),
        url: "/customer",
      });

      return NextResponse.json({
        success: true,
        audience: "single",
        recipientName: targetUser.name,
        notification: notif,
        bonusCreditedTo: bonusCreditedCount,
        pushDevicesSent,
      });
    }

    // 2. Segmented / Filtered Group Targeting
    const allCustomers = await dbService.getAllCustomers(1000);
    let targetCustomers = allCustomers;

    if (audience === "gold") {
      targetCustomers = allCustomers.filter(
        (c) => c.tier === "Gold" || (c.tier as string) === "Platinum" || (c.lifetimePoints && c.lifetimePoints >= 500)
      );
    } else if (audience === "silver") {
      targetCustomers = allCustomers.filter(
        (c) => c.tier === "Silver"
      );
    } else if (audience === "inactive") {
      targetCustomers = allCustomers.filter(
        (c) => !c.pointsBalance || c.pointsBalance <= 0
      );
    }

    // Create system notification
    const notif = await dbService.createNotification({
      customerId: audience === "all" ? "all" : `segment_${audience}`,
      title: title.trim(),
      message: message.trim(),
      type: "BROADCAST",
    });

    // Credit bonus points if specified
    if (bonus > 0 && targetCustomers.length > 0) {
      for (const cust of targetCustomers) {
        const newBalance = (cust.pointsBalance || 0) + bonus;
        const newLifetime = (cust.lifetimePoints || 0) + bonus;
        await dbService.updateUser(cust._id, {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
        });

        await dbService.createTransaction({
          type: "EARN",
          customerId: cust._id,
          customerName: cust.name,
          customerPhone: cust.phone,
          billAmount: 0,
          points: bonus,
          balanceAfter: newBalance,
          referenceCode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Promo (${audience.toUpperCase()}): ${title}`,
        });
        bonusCreditedCount++;
      }
    }

    // Dispatch Web Push
    let targetSubs: any[] = [];
    if (audience === "all") {
      targetSubs = await dbService.getAllPushSubscriptions();
    } else {
      for (const cust of targetCustomers) {
        const subs = await dbService.getPushSubscriptionsForUser(cust._id);
        targetSubs.push(...subs);
      }
    }

    const pushDevicesSent = await sendWebPushToSubscriptions(targetSubs, {
      title: title.trim(),
      body: bonus > 0 ? `${message.trim()} (+${bonus} bonus points added!)` : message.trim(),
      url: "/customer",
    });

    return NextResponse.json({
      success: true,
      audience,
      targetedMembersCount: targetCustomers.length,
      notification: notif,
      bonusCreditedTo: bonusCreditedCount,
      pushDevicesSent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
