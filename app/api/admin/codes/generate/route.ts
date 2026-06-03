import { NextResponse } from "next/server";
import { createRedeemCodes } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const { count, resumeCredits, interviewCredits, prefix } = await req.json();
    if (!count || count > 100) return NextResponse.json({ error: "数量1-100" }, { status: 400 });

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push((prefix || "PM") + "-" + random);
    }

    await createRedeemCodes(codes, resumeCredits || 3, interviewCredits || 3);

    return NextResponse.json({ codes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
