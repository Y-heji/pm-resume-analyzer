import { NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";
import { parseDocx } from "@/lib/word-parser";

function detectTypeByHeader(buffer: ArrayBuffer): "pdf" | "docx" | "doc" | "unknown" {
  if (buffer.byteLength < 4) return "unknown";
  const h = new Uint8Array(buffer.slice(0, 4));
  // %PDF header
  if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return "pdf";
  // PK (ZIP) header — .docx or .xlsx etc
  if (h[0] === 0x50 && h[1] === 0x4b) return "docx";
  // OLE2 header — old .doc
  if (h[0] === 0xd0 && h[1] === 0xcf && h[2] === 0x11 && h[3] === 0xe0) return "doc";
  return "unknown";
}

export async function POST(req: Request) {
  let headerType: ReturnType<typeof detectTypeByHeader> = "unknown";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传简历文件" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    headerType = detectTypeByHeader(buffer);

    if (headerType === "unknown") {
      return NextResponse.json(
        { error: "无法识别文件格式。请上传标准 PDF 或 .docx 格式的简历文件。" },
        { status: 400 }
      );
    }

    if (headerType === "doc") {
      return NextResponse.json(
        { error: "检测到旧版 .doc 格式，暂不支持。请用 Word 打开该文件，另存为 .docx 格式，或导出为 PDF 后上传。" },
        { status: 400 }
      );
    }

    const text = headerType === "docx" ? await parseDocx(buffer) : await parsePdf(buffer);

    return NextResponse.json({ text });
  } catch (err: any) {
    const msg = err?.message || "文件解析失败";
    console.error("[parse-pdf] type=" + headerType + " error:", msg);
    // Catch JSZip/ZIP errors from mammoth
    if (msg.includes("end of central directory") || msg.includes("zip file") || msg.includes("Zip")) {
      return NextResponse.json(
        { error: "文件已损坏或格式不兼容。请确认是有效的 .docx 文件，或尝试导出为 PDF 后上传。" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
