import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageTracker from "@/components/page-tracker";
import AuthButton from "@/components/auth/auth-button";
import PremiumBar from "@/components/auth/premium-bar";
import CsButton from "@/components/cs-button";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AI 职业师 | 简历匹配 · ATS 检测 · 模拟面试",
  description: "上传简历 + 粘贴 JD，AI 自动分析匹配度、ATS 风险、缺失技能，生成优化建议和学习路径。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors">
            PM Resume Analyzer
          </a>
          <AuthButton />
        </header>
        <PremiumBar />
        <main className="flex-1"><PageTracker>{children}</PageTracker></main>
        <Footer />
        <CsButton />
      </body>
    </html>
  );
}
