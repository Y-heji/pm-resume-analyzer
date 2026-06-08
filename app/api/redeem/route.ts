import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redeemCode } from "@/lib/credits";
import { checkCsrf, csrfError } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!checkCsrf(req)) return csrfError();
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "请输入兑换码" }, { status: 400 });

    const email = await getCurrentUser();
    if (!email) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const normalized = code.trim().toUpperCase();
    const redeem = await redeemCode(email, normalized);
    if (!redeem) return NextResponse.json({ error: "兑换码无效或已被使用" }, { status: 400 });

    return NextResponse.json({
      success: true,
      resume_optimize_left: redeem.resume_optimize,
      mock_interview_left: redeem.mock_interview,
      tag: redeem.tag || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "兑换失败：" + err.message }, { status: 500 });
  }
}
