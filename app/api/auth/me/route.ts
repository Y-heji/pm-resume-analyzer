import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/credits";

export async function GET() {
  const email = await getCurrentUser();
  if (!email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const e = await getEntitlements(email);
  return NextResponse.json({
    email,
    is_premium: e.is_premium,
    activated_at: e.activated_at,
    resume_optimize_left: e.resume_optimize_left,
    mock_interview_left: e.mock_interview_left,
  });
}
