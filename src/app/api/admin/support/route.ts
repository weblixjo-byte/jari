import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "cashier")) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      subject,
      message,
      category = "Bug / System Glitch",
      contactPhone,
      senderName,
      diagnostics = {},
      ticketId,
    } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and description are required." },
        { status: 400 }
      );
    }

    const accessKey =
      process.env.WEB3FORMS_ACCESS_KEY ||
      process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
      "7f0e27f4-7df7-4105-af7a-985d05cc02d1";

    const id = ticketId || "TKT-" + Math.floor(100000 + Math.random() * 900000);

    const payload = {
      access_key: accessKey,
      subject: `[Support Ticket ${id}] ${category}: ${subject}`,
      from_name: `${senderName || session.username || "Admin"} (Store Admin)`,
      email: "info@weblix-jo.com",
      "Ticket Reference ID": id,
      "Issue Category": category,
      "Subject": subject,
      "Detailed Description": message,
      "Contact Phone / WhatsApp": contactPhone || "None provided",
      ...diagnostics,
      "Submitted At": new Date().toLocaleString("en-US", { timeZone: "Asia/Amman" }) + " (Amman Time)",
      botcheck: "",
    };

    const web3Res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data: any = null;
    try {
      const text = await web3Res.text();
      data = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. Cloudflare HTML block)
    }

    if (web3Res.ok && data?.success) {
      return NextResponse.json({
        success: true,
        message: "Support ticket submitted successfully.",
        ticketId: id,
      });
    } else {
      return NextResponse.json(
        { error: data?.message || "Web3Forms submission requires client-side submission." },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Support ticket dispatch error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error dispatching support ticket." },
      { status: 500 }
    );
  }
}
