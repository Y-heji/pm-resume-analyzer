import { NextResponse } from "next/server";
import { verifyCode, signToken, setAuthCookie, getOrCreateUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const valid = await verifyCode(normalized, code);
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
