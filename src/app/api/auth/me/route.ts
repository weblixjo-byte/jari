import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const user = await dbService.findUserById(session.userId);
    const config = await dbService.getConfig();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        pin: user.pin,
        tier: user.tier,
        pointsBalance: user.pointsBalance,
        lifetimePoints: user.lifetimePoints,
        username: user.username,
        branchName: user.branchName,
        email: user.email,
      },
      config,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
