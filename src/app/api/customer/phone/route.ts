import { NextResponse } from "next/server";
import { getSession, signToken, TOKEN_COOKIE_NAME, PERMANENT_COOKIE_MAX_AGE } from "@/lib/auth";
import { dbService } from "@/lib/db";

function cleanJordanianPhone(input: string): string {
  if (!input) return "";
  // Strip spaces, dashes, parentheses, dots
  let cleaned = input.replace(/[\s\-\(\)\.]/g, "");
  
  // Strip international country codes
  if (cleaned.startsWith("+962")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("00962")) {
    cleaned = "0" + cleaned.slice(5);
  } else if (cleaned.startsWith("962")) {
    cleaned = "0" + cleaned.slice(3);
  }

  // If user entered 9 digits starting with 77, 78, 79 (e.g. 791234567), prepend 0
  if (/^7[789]\d{7}$/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const rawPhone = body.phone || "";
    const cleanedPhone = cleanJordanianPhone(rawPhone);

    // Strict Jordanian mobile phone validation: exactly 10 digits starting with 079, 078, or 077
    const jordanianPhoneRegex = /^07[789]\d{7}$/;
    if (!jordanianPhoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        {
          error: "Invalid Jordanian phone number. Must be 10 digits starting with 077, 078, or 079 (e.g. 0791234567).",
        },
        { status: 400 }
      );
    }

    // Check if phone number is already registered to another customer
    const existingUser = await dbService.findUserByPhone(cleanedPhone);
    if (existingUser && existingUser._id.toString() !== session.userId) {
      return NextResponse.json(
        { error: "This phone number is already registered to another account." },
        { status: 409 }
      );
    }

    // Update phone number for customer
    const updatedUser = await dbService.updateUser(session.userId, {
      phone: cleanedPhone,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Customer not found or update failed" }, { status: 404 });
    }

    // Generate fresh persistent token with updated phone
    const token = signToken({
      userId: updatedUser._id,
      role: "customer",
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      tier: updatedUser.tier,
    });

    const response = NextResponse.json({
      success: true,
      message: "Phone number updated successfully",
      phone: updatedUser.phone,
      token,
      customer: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        pointsBalance: updatedUser.pointsBalance,
        lifetimePoints: updatedUser.lifetimePoints,
        tier: updatedUser.tier,
      },
    });

    // Refresh 10-year persistent session cookie
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
    console.error("Update phone error:", error);
    return NextResponse.json({ error: error.message || "Failed to update phone number" }, { status: 500 });
  }
}
