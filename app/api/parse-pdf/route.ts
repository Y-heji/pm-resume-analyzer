import { NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";
import { parseWord } from "@/lib/word-parser";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function resolveType(file: File): "pdf" | "word" {
  if (file.type === "application/pdf") return "pdf";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  )
    return "word";
  return "pdf"; // fallback, will likely fail
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "请上传简历文件" },
        { status: 400 }
      );
    }

    const type = resolveType(file);
    const buffer = await file.arrayBuffer();

    let text: string;
    if (type === "word") {
      text = await parseWord(buffer);
    } else {
      text = await parsePdf(buffer);
    }

    return NextResponse.json({ text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "文件解析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
