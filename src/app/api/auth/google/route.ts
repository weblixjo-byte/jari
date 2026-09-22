import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl, googleId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Google account email and name are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanGoogleId = googleId?.trim() || `google_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    // 1. Check if customer already exists by Google ID or Email
    let user = await dbService.findUserByGoogleId(cleanGoogleId);
    if (!user) {
      user = await dbService.findUserByEmail(cleanEmail);
    }

    const config = await dbService.getConfig();
    let isNewUser = false;

    if (!user) {
      // 2. New Customer Sign-Up via Google (First Time)
      isNewUser = true;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const qrSecret = `jari_token_${cleanEmail.replace(/[^a-z0-9]/g, "_")}_${pin}`;

      user = await dbService.createUser({
        role: "customer",
        name: name.trim(),
        email: cleanEmail,
        googleId: cleanGoogleId,
        avatarUrl: avatarUrl || "",
        pin,
        qrSecret,
        pointsBalance: config.welcomeBonusPts || 50,
        lifetimePoints: config.welcomeBonusPts || 50,
        tier: "Member",
      });

      // Record welcome transaction & notification
      if (config.welcomeBonusPts > 0) {
        await dbService.createTransaction({
          type: "EARN",
          customerId: user._id,
          customerName: user.name,
          billAmount: 0,
          points: config.welcomeBonusPts,
          balanceAfter: config.welcomeBonusPts,
          referenceCode: `WB-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: "Google Sign-Up Welcome Bonus Points",
        });

        await dbService.createNotification({
          customerId: user._id,
          title: `Welcome to ${config.storeName}!`,
          message: `You have earned ${config.welcomeBonusPts} welcome bonus points with your Google account. Enjoy your rewards!`,
          type: "POINTS_EARNED",
        });
      }
    } else {
      // Existing user logging in with Google: ensure googleId/avatarUrl updated if missing
      const updates: any = {};
      if (!user.googleId) updates.googleId = cleanGoogleId;
      if (avatarUrl && user.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;
      if (Object.keys(updates).length > 0) {
        user = (await dbService.updateUser(user._id, updates)) || user;
      }
    }

    // 3. Create Session Token
    const token = signToken({
      userId: user._id,
      role: "customer",
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      googleId: user.googleId,
      tier: user.tier,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        pin: user.pin,
        tier: user.tier,
        pointsBalance: user.pointsBalance,
      },
    });

    // Set permanent 1-year secure session cookie
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
    return NextResponse.json(
      { error: error.message || "Google authentication failed" },
      { status: 500 }
    );
  }
}
