import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const cashiers = (await dbService.getAllCashiers()).filter((c) => c.username !== "ahmad");
    return NextResponse.json({
      success: true,
      cashiers: cashiers.map((c) => ({
        id: c._id,
        name: c.name,
        username: c.username,
        branchName: c.branchName,
        staffPin: c.staffPin,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, branchName, staffPin } = body;

    if (!name || !username || !staffPin) {
      return NextResponse.json(
        { error: "Name, username, and 4-digit PIN are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await dbService.findStaffByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const newCashier = await dbService.createUser({
      role: "cashier",
      name: name.trim(),
      username: username.toLowerCase().trim(),
      branchName: branchName?.trim() || "Downtown Flagship",
      staffPin: staffPin.trim(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      cashier: {
        id: newCashier._id,
        name: newCashier.name,
        username: newCashier.username,
        branchName: newCashier.branchName,
        staffPin: newCashier.staffPin,
        isActive: newCashier.isActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, isActive, staffPin, branchName, name } = body;

    if (!id) {
      return NextResponse.json({ error: "Cashier ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (staffPin) updates.staffPin = staffPin.trim();
    if (branchName) updates.branchName = branchName.trim();
    if (name) updates.name = name.trim();

    const updated = await dbService.updateUser(id, updates);
    return NextResponse.json({ success: true, cashier: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Cashier ID is required" }, { status: 400 });
    }

    await dbService.deleteUser(id);
    return NextResponse.json({ success: true, message: "Cashier deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
