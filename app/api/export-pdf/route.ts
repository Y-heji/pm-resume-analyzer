import { NextResponse } from "next/server";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import fs from "fs";
import path from "path";
import ResumePdfDocument from "@/components/resume-pdf-document";

let fontRegistered = false;

function ensureFont() {
  if (fontRegistered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  const regularPath = path.join(dir, "NotoSansSC.otf");
  const boldPath = path.join(dir, "NotoSansSC-Bold.otf");

  if (!fs.existsSync(regularPath)) {
    console.warn("Font not found at", regularPath);
    return;
  }

  const fonts: { src: string; fontWeight?: number }[] = [{ src: regularPath }];
  if (fs.existsSync(boldPath)) {
    fonts.push({ src: boldPath, fontWeight: 700 });
  }

  Font.register({ family: "Noto Sans SC", fonts });
  // Register bold variant
  if (fs.existsSync(boldPath)) {
    Font.register({
      family: "Noto Sans SC-Bold",
      fonts: [{ src: boldPath }],
    });
  }
  fontRegistered = true;
}

export async function POST(req: Request) {
  try {
    const { finalResume, deepAnalysis } = await req.json();

    if (!finalResume) {
      return NextResponse.json({ error: "缺少简历数据" }, { status: 400 });
    }

    ensureFont();

    const pdfBuffer = await renderToBuffer(
      createElement(ResumePdfDocument, { finalResume, deepAnalysis: deepAnalysis || undefined })
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${Date.now()}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF 生成失败，请重试" }, { status: 500 });
  }
}
