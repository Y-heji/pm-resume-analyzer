import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements, isPremium } from "@/lib/credits";

export async function GET() {
  const email = await getCurrentUser();
  if (!email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const e = await getEntitlements(email);
  return NextResponse.json({
    email,
    status: e.status,
    is_premium: isPremium(e),
    activated_at: e.activated_at,
    resume_optimize_left: e.resume_optimize_left,
    mock_interview_left: e.mock_interview_left,
    tag: e.tag || null,
  });
}
