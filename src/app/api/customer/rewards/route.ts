import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    const rewards = await dbService.getRewards(true);
    let userPoints = 0;

    if (session && session.role === "customer") {
      const user = await dbService.findUserById(session.userId);
      if (user) userPoints = user.pointsBalance;
    }

    // Ensure strict ascending sort by pointsRequired (lowest to highest)
    const sorted = [...rewards].sort((a, b) => a.pointsRequired - b.pointsRequired);

    return NextResponse.json({
      success: true,
      rewards: sorted.map((r) => ({
        ...r,
        canRedeem: userPoints >= r.pointsRequired,
      })),
      userPoints,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(_req: Request) {
  return NextResponse.json(
    {
      error: "Direct client redemption is disabled. Please present your 6-digit PIN or QR code to the cashier at the counter to activate your discount.",
      requiresCashier: true,
    },
    { status: 403 }
  );
}
