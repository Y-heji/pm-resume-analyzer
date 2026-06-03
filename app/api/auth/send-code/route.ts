import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateCode, saveCode } from "@/lib/auth";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const code = generateCode();
    await saveCode(normalized, code);

    // Send actual email
    await transporter.sendMail({
      from: `"禾急求职助手" <${process.env.SMTP_USER}>`,
      to: normalized,
      subject: "验证码 - 禾急求职助手",
      text: `您的验证码是：${code}，5分钟内有效。`,
      html: `<div style="font-family:sans-serif;padding:20px"><h2>禾急求职助手</h2><p>您的验证码是：</p><h1 style="font-size:32px;letter-spacing:4px;color:#2563eb">${code}</h1><p>5分钟内有效，请勿泄露。</p></div>`,
    });

    return NextResponse.json({ success: true, message: "验证码已发送" });
  } catch (err: any) {
    console.error("[send-code]", err.message);
    return NextResponse.json({ error: "发送失败：" + err.message }, { status: 500 });
  }
}
