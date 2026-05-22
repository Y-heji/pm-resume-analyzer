import { NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "请上传 PDF 文件" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "请上传 PDF 格式的文件" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const text = await parsePdf(buffer);

    return NextResponse.json({ text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "PDF 解析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
