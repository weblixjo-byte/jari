import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { sendWebPushToUser } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "cashier" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized: Cashier access required" }, { status: 403 });
    }

    const { customerId, pointsToRedeem, rewardTitle, discountAmount, notes } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const points = Number(pointsToRedeem);
    if (!Number.isInteger(points) || points <= 0 || points > 1000000) {
      return NextResponse.json({ error: "Valid integer points amount to redeem (1 to 1,000,000) is required" }, { status: 400 });
    }

    const customer = await dbService.findUserById(customerId);
    if (!customer || customer.role !== "customer") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (customer.pointsBalance < points) {
      return NextResponse.json(
        {
          error: `Insufficient points. Customer has ${customer.pointsBalance} pts, attempting to redeem ${points} pts.`,
        },
        { status: 400 }
      );
    }

    const config = await dbService.getConfig();
    const oldBalance = customer.pointsBalance;
    const newBalance = oldBalance - points;

    // Update customer
    await dbService.updateUser(customer._id, {
      pointsBalance: newBalance,
    });

    const refCode = `RD-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create redemption transaction
    const tx = await dbService.createTransaction({
      type: "REDEEM",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      cashierId: session.userId,
      cashierName: session.name,
      branchName: session.branchName || "Main Roastery",
      points: -points,
      balanceAfter: newBalance,
      rewardTitle: rewardTitle || "Loyalty Points Discount",
      referenceCode: refCode,
      notes: notes || (discountAmount ? `Cash discount: ${discountAmount} ${config.currency}` : "Points Redemption"),
    });

    // Create customer notification
    await dbService.createNotification({
      customerId: customer._id,
      title: `Points Redeemed: -${points} Pts`,
      message: `${points} points were redeemed for ${rewardTitle || "discount"} at ${session.branchName || "jari"}. Remaining balance: ${newBalance} pts.`,
      type: "REWARD_CLAIMED",
    });

    // Dispatch instant Web Push to customer's phone
    sendWebPushToUser(customer._id, {
      title: `Reward Redeemed! -${points} pts`,
      body: `Successfully redeemed ${points} points for ${rewardTitle || "Reward"}. Remaining balance: ${newBalance} pts.`,
      url: "/customer",
    }).catch((err) => console.warn("Push delivery error:", err));

    return NextResponse.json({
      success: true,
      receipt: {
        referenceCode: refCode,
        customerId: customer._id,
        customerName: customer.name,
        rewardTitle: rewardTitle || "Discount Voucher",
        pointsRedeemed: points,
        oldBalance,
        newBalance,
        cashierName: session.name,
        branchName: session.branchName || "Main Roastery",
        createdAt: tx.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
