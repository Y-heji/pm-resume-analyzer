import path from "path";
import { pathToFileURL } from "url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  )
).href;

export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  if (buffer.byteLength === 0) {
    throw new Error("PDF file is empty");
  }

  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  await doc.destroy();

  const text = pages.join("\n").trim();
  if (!text || text.length < 10) {
    throw new Error(
      "PDF 解析结果为空或过短，请确认文件是文本型 PDF（非扫描版图片）。"
    );
  }

  return text;
}
