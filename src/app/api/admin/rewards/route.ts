import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const rewards = await dbService.getRewards(false);
    return NextResponse.json({ success: true, rewards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, pointsRequired, category, stock, isActive, imageUrl, claimCode } = body;

    if (!title || !pointsRequired) {
      return NextResponse.json({ error: "Reward title and points required are needed" }, { status: 400 });
    }

    const reward = await dbService.createReward({
      title: title.trim(),
      description: description ? description.trim() : "",
      pointsRequired: Number(pointsRequired),
      category: category || "Drinks",
      imageUrl: imageUrl ? imageUrl.trim() : "",
      stock: stock !== undefined ? Number(stock) : 999,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      claimCode: claimCode ? claimCode.trim().toUpperCase() : undefined,
    });

    return NextResponse.json({ success: true, reward });
  } catch (error: any) {
    console.error("POST /api/admin/rewards error:", error);
    return NextResponse.json({ error: error.message || "Failed to create reward" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 });
    }

    const updated = await dbService.updateReward(id, updates);
    return NextResponse.json({ success: true, reward: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 });
    }

    await dbService.deleteReward(id);
    return NextResponse.json({ success: true, message: "Reward deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
