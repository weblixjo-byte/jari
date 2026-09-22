import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { CustomerTier } from "@/lib/types";
import { sendWebPushToUser } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "cashier" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized: Cashier access required" }, { status: 403 });
    }

    const { customerId, billAmount, notes } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const bill = Number(billAmount);
    if (typeof billAmount === "undefined" || !Number.isFinite(bill) || bill <= 0 || bill > 10000) {
      return NextResponse.json({ error: "Valid positive bill amount between 0.01 and 10,000 is required" }, { status: 400 });
    }

    const customer = await dbService.findUserById(customerId);
    if (!customer || customer.role !== "customer") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const config = await dbService.getConfig();
    const pointsPerUnit = config.pointsPerUnit || 10;
    const pointsEarned = Math.floor(bill * pointsPerUnit);

    const oldBalance = customer.pointsBalance;
    const newBalance = oldBalance + pointsEarned;
    const newLifetime = customer.lifetimePoints + pointsEarned;

    // Determine tier
    let newTier: CustomerTier = customer.tier;
    if (newLifetime >= 1000) {
      newTier = "Gold";
    } else if (newLifetime >= 500) {
      newTier = "Silver";
    } else {
      newTier = "Member";
    }

    // Update customer
    await dbService.updateUser(customer._id, {
      pointsBalance: newBalance,
      lifetimePoints: newLifetime,
      tier: newTier,
    });

    const refCode = `TX-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create transaction log
    const tx = await dbService.createTransaction({
      type: "EARN",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      cashierId: session.userId,
      cashierName: session.name,
      branchName: session.branchName || "Main Roastery",
      billAmount: bill,
      points: pointsEarned,
      balanceAfter: newBalance,
      referenceCode: refCode,
      notes: notes || `Bill: ${bill.toFixed(3)} ${config.currency}`,
    });

    // Create notification for customer
    await dbService.createNotification({
      customerId: customer._id,
      title: `Points Credited: +${pointsEarned} Pts`,
      message: `You earned ${pointsEarned} points on your bill of ${bill.toFixed(3)} ${config.currency} at ${session.branchName || "jari"}. New balance: ${newBalance} pts.`,
      type: "POINTS_EARNED",
    });

    // Dispatch instant Web Push to customer's phone
    sendWebPushToUser(customer._id, {
      title: `Points Added! +${pointsEarned} pts`,
      body: `+${pointsEarned} points added to your balance. Current balance: ${newBalance} pts.`,
      url: "/customer",
    }).catch((err) => console.warn("Push delivery error:", err));

    return NextResponse.json({
      success: true,
      receipt: {
        referenceCode: refCode,
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        cashierName: session.name,
        branchName: session.branchName || "Main Roastery",
        billAmount: bill,
        currency: config.currency,
        pointsEarned,
        oldBalance,
        newBalance,
        tier: newTier,
        tierUpgraded: newTier !== customer.tier,
        createdAt: tx.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
