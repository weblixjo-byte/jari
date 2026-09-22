import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`pos_lookup_${ip}`, { limit: 40, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Lookup rate limit exceeded. Please wait a moment." }, { status: 429 });
    }

    const session = await getSession(req);
    if (!session || (session.role !== "cashier" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized: Cashier access required" }, { status: 403 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Customer PIN, QR token, or phone is required" }, { status: 400 });
    }

    let cleaned = query.trim();
    let requestedClaimCode: string | null = null;
    let requestedRewardId: string | null = null;

    // Check if query has a claim code suffix or parameter
    // e.g. "token:CLAIM:R1" or URL with ?claim=R1
    if (cleaned.includes(":CLAIM:")) {
      const parts = cleaned.split(":CLAIM:");
      cleaned = parts[0].trim();
      requestedClaimCode = parts[1]?.trim()?.toUpperCase() || null;
    } else if (cleaned.includes("claim=")) {
      try {
        const u = new URL(cleaned.startsWith("http") ? cleaned : `http://dummy.com/${cleaned}`);
        requestedClaimCode = u.searchParams.get("claim")?.toUpperCase() || null;
        requestedRewardId = u.searchParams.get("rewardId") || null;
      } catch {}
    }

    // Check if cleaned is formatted as 6 digits + 2-3 alphanumeric suffix:
    // e.g. "482-910-R1", "482 910 R1", "482910R1", "482910-R1"
    const pinWithSuffixMatch = cleaned.match(/^(\d{3})\s*[- ]?\s*(\d{3})\s*[- ]?\s*([A-Za-z]\d|[A-Za-z]{1,2}\d?)$/i);
    if (pinWithSuffixMatch) {
      cleaned = `${pinWithSuffixMatch[1]}${pinWithSuffixMatch[2]}`; // "482910"
      requestedClaimCode = pinWithSuffixMatch[3].toUpperCase(); // "R1"
    }

    // If scanned data is a full URL, extract relevant query parameters
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      try {
        const parsedUrl = new URL(cleaned);
        const extracted = parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("qr") || parsedUrl.searchParams.get("pin");
        if (extracted) {
          cleaned = extracted.trim();
        }
        if (!requestedClaimCode && parsedUrl.searchParams.get("claim")) {
          requestedClaimCode = parsedUrl.searchParams.get("claim")!.toUpperCase();
        }
      } catch {
        // Ignore URL parsing errors and keep cleaned
      }
    }

    let customer = null;

    // 1. Try 6-digit PIN (strip spaces/dashes: "482 - 910" -> "482910")
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly.length === 6) {
      customer = await dbService.findUserByPin(digitsOnly);
    }

    // 2. Try QR Secret or user ID
    if (!customer) {
      customer = await dbService.findUserByQrSecret(cleaned);
    }

    // 3. Try Email address
    if (!customer && cleaned.includes("@")) {
      customer = await dbService.findUserByEmail(cleaned);
    }

    // 4. Try Phone number
    if (!customer && digitsOnly.length >= 7) {
      customer = await dbService.findUserByPhone(cleaned);
    }

    // 5. Try Direct user ID match
    if (!customer) {
      customer = await dbService.findUserById(cleaned);
    }

    if (!customer || customer.role !== "customer") {
      return NextResponse.json(
        { error: "Customer not found. Verify the 6-digit PIN or scanned QR code." },
        { status: 404 }
      );
    }

    const config = await dbService.getConfig();
    const currencyValue = Number(
      ((customer.pointsBalance / 100) * (config.discountPer100Pts || 1.0)).toFixed(3)
    );

    const recentTxs = await dbService.getCustomerTransactions(customer._id);

    // Resolve targeted reward if claimCode or rewardId was provided
    let pendingReward = null;
    if (requestedClaimCode || requestedRewardId) {
      // Prioritize active rewards first so disabled or archived items never conflict
      const activeRewards = await dbService.getRewards(true);
      let match = activeRewards.find(
        (r) =>
          (requestedClaimCode && r.claimCode?.toUpperCase() === requestedClaimCode) ||
          (requestedRewardId && r._id === requestedRewardId)
      );
      if (!match) {
        const allRewards = await dbService.getRewards(false);
        match = allRewards.find(
          (r) =>
            (requestedClaimCode && r.claimCode?.toUpperCase() === requestedClaimCode) ||
            (requestedRewardId && r._id === requestedRewardId)
        );
      }
      if (match) {
        pendingReward = {
          id: match._id,
          title: match.title,
          pointsRequired: match.pointsRequired,
          category: match.category,
          imageUrl: match.imageUrl,
          claimCode: match.claimCode,
          canRedeem: customer.pointsBalance >= match.pointsRequired,
        };
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        pin: customer.pin,
        tier: customer.tier,
        pointsBalance: customer.pointsBalance,
        lifetimePoints: customer.lifetimePoints,
        currencyValue,
        currency: config.currency,
        pointsPerUnit: config.pointsPerUnit,
      },
      pendingReward,
      recentTransactions: recentTxs.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
