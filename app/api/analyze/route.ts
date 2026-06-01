import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { resumeText, jdText, deep } = await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { error: "请上传简历并填写岗位 JD" },
        { status: 400 }
      );
    }

    if (resumeText.length < 20) {
      return NextResponse.json(
        { error: "简历内容过短，请确认 PDF 解析正确" },
        { status: 400 }
      );
    }

    if (jdText.length < 2) {
      return NextResponse.json(
        { error: "请填写岗位名称或 JD 描述" },
        { status: 400 }
      );
    }

    const result = await analyzeResume(resumeText, jdText, deep === true);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "分析失败，请重试";
    console.error("Analysis error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
