import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Encode code into a 5-min expiry JWT
    const codeToken = await new SignJWT({ email: normalized, code })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5min")
      .sign(JWT_SECRET);

    await transporter.sendMail({
      from: `"禾急求职助手" <${process.env.SMTP_USER}>`,
      to: normalized,
      subject: "验证码 - 禾急求职助手",
      text: `您的验证码是：${code}，5分钟内有效。`,
      html: `<div style="font-family:sans-serif;padding:20px"><h2>禾急求职助手</h2><p>验证码：</p><h1 style="font-size:32px;letter-spacing:4px;color:#2563eb">${code}</h1><p>5分钟内有效。</p></div>`,
    });

    return NextResponse.json({ success: true, codeToken });
  } catch (err: any) {
    return NextResponse.json({ error: "发送失败：" + err.message }, { status: 500 });
  }
}
