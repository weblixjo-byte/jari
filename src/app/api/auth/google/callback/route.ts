import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { signToken, TOKEN_COOKIE_NAME, PERMANENT_COOKIE_MAX_AGE } from "@/lib/auth";

function getOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const origin = getOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawOauthError = url.searchParams.get("error");
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (rawOauthError) {
    let cleanError = rawOauthError;
    try {
      cleanError = decodeURIComponent(rawOauthError);
    } catch {
      cleanError = rawOauthError;
    }
    return NextResponse.redirect(`${origin}/customer?error=${encodeURIComponent(cleanError)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/customer?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/customer?error=missing_credentials`);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return NextResponse.redirect(`${origin}/customer?error=token_exchange_failed`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await profileResponse.json();
    if (!profileResponse.ok || !googleUser.email) {
      console.error("Google userinfo error:", googleUser);
      return NextResponse.redirect(`${origin}/customer?error=profile_fetch_failed`);
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const googleId = googleUser.sub;
    const name = googleUser.name || googleUser.given_name || "jari Member";
    const avatarUrl = googleUser.picture || "";

    // 3. Find or Create Customer
    let user = await dbService.findUserByGoogleId(googleId);
    if (!user) {
      user = await dbService.findUserByEmail(cleanEmail);
    }

    const config = await dbService.getConfig();

    if (!user) {
      // First-time signup with Google (no phone yet)
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const qrSecret = `jari_token_${cleanEmail.replace(/[^a-z0-9]/g, "_")}_${pin}`;

      user = await dbService.createUser({
        role: "customer",
        name,
        email: cleanEmail,
        googleId,
        avatarUrl,
        pin,
        qrSecret,
        pointsBalance: config.welcomeBonusPts || 50,
        lifetimePoints: config.welcomeBonusPts || 50,
        tier: "Member",
      });

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
          message: `You have received ${config.welcomeBonusPts} welcome bonus points to your new account.`,
          type: "POINTS_EARNED",
        });
      }
    } else {
      // Returning customer: update avatar / googleId if needed
      const updates: any = {};
      if (!user.googleId) updates.googleId = googleId;
      if (avatarUrl && user.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;
      if (Object.keys(updates).length > 0) {
        user = (await dbService.updateUser(user._id, updates)) || user;
      }
    }

    // 4. Sign JWT session token (10 years)
    const token = signToken({
      userId: user._id,
      role: "customer",
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      googleId: user.googleId,
      tier: user.tier,
    });

    const redirectUrl = new URL(`${origin}/customer`);
    redirectUrl.searchParams.set("token", token);

    const redirectResponse = NextResponse.redirect(redirectUrl.toString());
    redirectResponse.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PERMANENT_COOKIE_MAX_AGE,
      path: "/",
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("OAuth callback exception:", err);
    let errMsg = "oauth_exception";
    try {
      errMsg = decodeURIComponent(err.message || "oauth_exception");
    } catch {
      errMsg = err.message || "oauth_exception";
    }
    return NextResponse.redirect(`${origin}/customer?error=${encodeURIComponent(errMsg)}`);
  }
}
