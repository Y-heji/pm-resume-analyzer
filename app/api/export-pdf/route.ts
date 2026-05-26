import { NextResponse } from "next/server";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import fs from "fs";
import path from "path";
import ResumePdfDocument from "@/components/resume-pdf-document";
import { getTemplate } from "@/lib/resume-templates";

let fontRegistered = false;

function ensureFont() {
  if (fontRegistered) return;
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "NotoSansSC.otf"
  );
  if (!fs.existsSync(fontPath)) {
    console.warn("Font file not found at", fontPath);
    return;
  }
  Font.register({
    family: "Noto Sans SC",
    fonts: [{ src: fontPath }],
  });
  fontRegistered = true;
}

export async function POST(req: Request) {
  try {
    const { finalResume, template: templateId } = await req.json();

    if (!finalResume) {
      return NextResponse.json(
        { error: "缺少简历数据" },
        { status: 400 }
      );
    }

    const template = getTemplate(templateId || "ai-pm");

    ensureFont();

    const pdfBuffer = await renderToBuffer(
      createElement(ResumePdfDocument, { finalResume, template })
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
    return NextResponse.json(
      { error: "PDF 生成失败，请重试" },
      { status: 500 }
    );
  }
}
