import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "cashier")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const customers = await dbService.getAllCustomers(200);
    return NextResponse.json({
      success: true,
      customers: customers.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        pointsBalance: c.pointsBalance,
        tier: c.tier,
        lifetimePoints: c.lifetimePoints,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
