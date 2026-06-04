import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { renderHTML } from "@/lib/pdf-html-renderer";

let _browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    let exePath: string;
    try {
      exePath = await chromium.executablePath();
    } catch {
      // Fallback: try common Vercel paths
      const fs = await import("fs");
      const candidates = [
        "/tmp/chromium",
        "/var/task/node_modules/@sparticuz/chromium/bin/chromium",
        "/var/task/node_modules/@sparticuz/chromium-min/bin/chromium",
      ];
      exePath = candidates.find(p => fs.existsSync(p)) || candidates[0];
    }
    console.log("[pdf] chromium path:", exePath);
    return puppeteer.launch({
      args: chromium.args,
      executablePath: exePath,
      headless: chromium.headless,
    });
  }
  return puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function POST(req: Request) {
  try {
    const { finalResume, templateId } = await req.json();
    if (!finalResume) return NextResponse.json({ error: "缺少简历数据" }, { status: 400 });

    const html = renderHTML(finalResume, templateId || "swiss");
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${Date.now()}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("PDF error:", err.message);
    return NextResponse.json({ error: "PDF 生成失败：" + err.message }, { status: 500 });
  }
}
