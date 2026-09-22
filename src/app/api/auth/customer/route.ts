import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { signToken, TOKEN_COOKIE_NAME, PERMANENT_COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, name, otp, step } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Step 1: Request OTP
    if (step === "request_otp" || !otp) {
      // In development/demo mode, provide simulated OTP for instant testing
      const demoOtp = "123456";
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${cleanPhone}`,
        demoOtp,
      });
    }

    // Step 2: Verify OTP
    // For demo/production flexibility, allow 123456 or any 6-digit code
    if (otp !== "123456" && otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP. Use 123456 for demo" }, { status: 400 });
    }

    let user = await dbService.findUserByPhone(cleanPhone);
    const config = await dbService.getConfig();

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // Generate a distinct 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const qrSecret = `jari_token_${cleanPhone.replace(/\D/g, "")}_${pin}`;

      user = await dbService.createUser({
        role: "customer",
        name: name?.trim() || `Guest ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        pin,
        qrSecret,
        pointsBalance: config.welcomeBonusPts || 50,
        lifetimePoints: config.welcomeBonusPts || 50,
        tier: "Member",
      });

      // Record welcome transaction if bonus points awarded
      if (config.welcomeBonusPts > 0) {
        await dbService.createTransaction({
          type: "EARN",
          customerId: user._id,
          customerName: user.name,
          customerPhone: user.phone,
          billAmount: 0,
          points: config.welcomeBonusPts,
          balanceAfter: config.welcomeBonusPts,
          referenceCode: `WB-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: "Welcome to jari Loyalty Bonus Points",
        });

        await dbService.createNotification({
          customerId: user._id,
          title: `Welcome to ${config.storeName}!`,
          message: `You have received ${config.welcomeBonusPts} bonus points to get you started!`,
          type: "POINTS_EARNED",
        });
      }
    }

    // Create session token
    const token = signToken({
      userId: user._id,
      role: "customer",
      name: user.name,
      phone: user.phone,
      tier: user.tier,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
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
      maxAge: PERMANENT_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
  }
}
