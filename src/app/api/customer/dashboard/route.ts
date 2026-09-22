import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
    }

    const user = await dbService.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Customer account not found" }, { status: 404 });
    }

    const config = await dbService.getConfig();
    const transactions = await dbService.getCustomerTransactions(user._id);
    const notifications = await dbService.getNotifications(user._id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Calculate currency equivalent
    // e.g. 100 points = 1.00 KWD discount -> value = (points / 100) * discountPer100Pts
    const currencyValue = Number(
      ((user.pointsBalance / 100) * (config.discountPer100Pts || 1.0)).toFixed(3)
    );

    // Format 6-digit PIN into visual chunks: "482 - 910"
    const formattedPin = user.pin
      ? `${user.pin.slice(0, 3)} - ${user.pin.slice(3, 6)}`
      : "000 - 000";

    // Ensure 1-year persistent token
    const token = signToken({
      userId: user._id,
      role: "customer",
      name: user.name,
      email: user.email,
      phone: user.phone,
      tier: user.tier,
    });

    const response = NextResponse.json({
      success: true,
      token,
      customer: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        rawPin: user.pin,
        formattedPin,
        qrSecret: user.qrSecret || user._id,
        pointsBalance: user.pointsBalance,
        lifetimePoints: user.lifetimePoints,
        tier: user.tier,
        currencyValue,
        currency: config.currency,
      },
      config: {
        storeName: config.storeName,
        tagline: config.tagline,
        currency: config.currency,
        primaryColor: config.primaryColor,
        accentColor: config.accentColor,
        discountPer100Pts: config.discountPer100Pts,
      },
      transactions: transactions.slice(0, 10),
      unreadNotificationsCount: unreadCount,
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
