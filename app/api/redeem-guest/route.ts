import { NextResponse } from "next/server";
import { redeemGuestCode } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "请输入体验码" }, { status: 400 });

    const normalized = code.trim().toUpperCase();
    const count = await redeemGuestCode(normalized);
    if (count === null) return NextResponse.json({ error: "体验码无效或已被使用" }, { status: 400 });

    return NextResponse.json({ success: true, paid_interviews: count });
  } catch (err: any) {
    return NextResponse.json({ error: "兑换失败：" + err.message }, { status: 500 });
  }
}
