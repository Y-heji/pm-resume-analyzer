import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { signToken, setAuthCookie, getOrCreateUser } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

export async function POST(req: Request) {
  try {
    const { email, code, codeToken } = await req.json();
    if (!email || !code || !codeToken) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Verify codeToken JWT
    let valid = false;
    try {
      const { payload } = await jwtVerify(codeToken, JWT_SECRET);
      if (payload.email === normalized && payload.code === code.trim()) {
        valid = true;
      }
    } catch {}

    if (!valid) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 });
    }

    await getOrCreateUser(normalized);
    const token = await signToken(normalized);
    await setAuthCookie(token);

    return NextResponse.json({ success: true, email: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: "验证失败：" + err.message }, { status: 500 });
  }
}
