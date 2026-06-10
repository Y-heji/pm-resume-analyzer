import { NextResponse } from "next/server";
import { rewriteResume } from "@/lib/rewrite";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements, consumeResumeOptimize } from "@/lib/credits";
import { redis } from "@/lib/auth";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

export async function POST(req: Request) {
  try {
    const { resumeText, jdText, deep } = await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json({ error: "缺少简历文本或岗位JD" }, { status: 400 });
    }

    if (resumeText.length < 20) {
      return NextResponse.json({ error: "简历内容过短" }, { status: 400 });
    }

    if (jdText.length < 2) {
      return NextResponse.json({ error: "岗位JD过短" }, { status: 400 });
    }

    // Deep rewrite: check guest trial cookie first, then logged-in entitlements
    let guestToken: string | null = null;

    if (deep === true) {
      let consumed = false;

      const guestCookie = req.cookies.get("guest_trial")?.value;
      if (guestCookie) {
        try {
          const { payload } = await jwtVerify(guestCookie, JWT_SECRET);
          const remaining = (payload as any).guest_resume || 0;
          if (remaining > 0) {
            guestToken = await new (await import("jose")).SignJWT({
              guest_resume: remaining - 1,
              guest_interviews: (payload as any).guest_interviews || 0,
            })
              .setProtectedHeader({ alg: "HS256" })
              .setExpirationTime("24h")
              .sign(JWT_SECRET);
            consumed = true;
          }
        } catch {}
      }

      // Fall back to logged-in entitlements
      if (!consumed) {
        const email = await getCurrentUser();
        if (!email) {
          return NextResponse.json({ error: "深度优化需要先登录或激活体验码" }, { status: 401 });
        }
        const e = await getEntitlements(email);
        if (e.resume_optimize_left <= 0) {
          return NextResponse.json({ error: "AI深度优化次数不足，请先兑换" }, { status: 403 });
        }
        await consumeResumeOptimize(email);
      }
    }

    const result = await rewriteResume(resumeText, jdText, deep === true);
    await redis.set(`rewrite:${result.id}`, JSON.stringify(result), { ex: 86400 }).catch(() => {});
    const finalRes = NextResponse.json(result);
    if (guestToken) {
      finalRes.cookies.set("guest_trial", guestToken, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
      });
    }
    return finalRes;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "改写失败，请重试";
    console.error("Rewrite error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
