import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { registerServerFonts, resolveTemplate } from "@/components/pdf-templates";

export async function POST(req: Request) {
  try {
    const { finalResume, deepAnalysis, templateId } = await req.json();

    if (!finalResume) {
      return NextResponse.json({ error: "缺少简历数据" }, { status: 400 });
    }

    registerServerFonts();

    const TemplateComponent = await resolveTemplate(templateId || "tech");

    const pdfBuffer = await renderToBuffer(
      createElement(TemplateComponent, { finalResume, deepAnalysis: deepAnalysis || undefined })
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
