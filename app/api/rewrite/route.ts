import { NextResponse } from "next/server";
import { rewriteResume } from "@/lib/rewrite";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements, consumeResumeOptimize } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const { resumeText, jdText, deep } = await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { error: "缺少简历文本或岗位JD" },
        { status: 400 }
      );
    }

    if (resumeText.length < 20) {
      return NextResponse.json(
        { error: "简历内容过短，请确认上传了正确的简历" },
        { status: 400 }
      );
    }

    if (jdText.length < 2) {
      return NextResponse.json(
        { error: "岗位JD过短" },
        { status: 400 }
      );
    }

    // Deep rewrite consumes resume_optimize_left
    if (deep === true) {
      const email = await getCurrentUser();
      if (!email) {
        return NextResponse.json({ error: "深度优化需要先登录" }, { status: 401 });
      }
      const e = await getEntitlements(email);
      if (e.resume_optimize_left <= 0) {
        return NextResponse.json({ error: "AI深度优化次数不足，请先兑换" }, { status: 403 });
      }
      await consumeResumeOptimize(email);
    }

    const result = await rewriteResume(resumeText, jdText, deep === true);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "改写失败，请重试";
    console.error("Rewrite error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
