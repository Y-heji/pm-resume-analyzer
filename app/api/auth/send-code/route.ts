import { NextResponse } from "next/server";
import { generateCode, saveCode } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    }

    const code = generateCode();
    await saveCode(email.toLowerCase().trim(), code);

    // In production, send via Resend/SES. For MVP, return code in response.
    console.log(`[Auth] Code for ${email}: ${code}`);

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      code, // MVP: always show code until email service is integrated
    });
  } catch (err: any) {
    return NextResponse.json({ error: "发送失败：" + err.message }, { status: 500 });
  }
}
