import { NextResponse } from "next/server";
import { redeemGuestCode } from "@/lib/credits";
import { SignJWT } from "jose";
import { checkCsrf, csrfError } from "@/lib/admin-auth";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

export async function POST(req: Request) {
  if (!checkCsrf(req)) return csrfError();
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "请输入体验码" }, { status: 400 });

    const normalized = code.trim().toUpperCase();
    const result = await redeemGuestCode(normalized);
    if (result === null) return NextResponse.json({ error: "体验码无效或已被使用" }, { status: 400 });

    const { resume_optimize, paid_interviews } = result;

    const guestToken = await new SignJWT({
      guest_resume: resume_optimize || 0,
      guest_interviews: paid_interviews || 0,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const res = NextResponse.json({
      success: true,
      resume_optimize: resume_optimize || 0,
      paid_interviews: paid_interviews || 0,
    });

    res.cookies.set("guest_trial", guestToken, {
      httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: "兑换失败：" + err.message }, { status: 500 });
  }
}
