import { NextResponse } from "next/server";
import { createRedeemCodes, TIER_PRESETS } from "@/lib/credits";
import { checkAdminAuth, adminAuthError } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return adminAuthError();
  try {
    const { count, resumeOptimize, mockInterview, prefix, tag } = await req.json();
    if (!count || count > 100) return NextResponse.json({ error: "数量1-100" }, { status: 400 });

    // Auto-set defaults from tier preset if tag provided
    const tier = (tag && TIER_PRESETS[tag]) ? tag : null;
    const resume = resumeOptimize || (tier ? TIER_PRESETS[tier].resume : 3);
    const interview = mockInterview || (tier ? TIER_PRESETS[tier].interview : 3);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push((prefix || "PM") + "-" + random);
    }

    await createRedeemCodes(codes, resume, interview, tier);

    return NextResponse.json({ codes, tag: tier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
