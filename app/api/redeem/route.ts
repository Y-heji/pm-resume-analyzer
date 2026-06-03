import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRedeemCode, markCodeUsed, addCredits } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "请输入兑换码" }, { status: 400 });

    const email = await getCurrentUser();
    if (!email) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const normalized = code.trim().toUpperCase();
    const redeem = await getRedeemCode(normalized);
    if (!redeem) return NextResponse.json({ error: "兑换码无效" }, { status: 400 });
    if (redeem.used) return NextResponse.json({ error: "兑换码已被使用" }, { status: 400 });

    await markCodeUsed(normalized, email);
    await addCredits(email, redeem.resume_credits, redeem.interview_credits, `兑换码 ${normalized}`);

    return NextResponse.json({
      success: true,
      resume_credits: redeem.resume_credits,
      interview_credits: redeem.interview_credits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "兑换失败：" + err.message }, { status: 500 });
  }
}
