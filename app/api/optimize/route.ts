import { NextResponse } from "next/server";
import { rewriteResume } from "@/lib/rewrite";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements, consumeResumeOptimize } from "@/lib/credits";
import { redis } from "@/lib/auth";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

// POST /api/optimize — always deep=paid, always consumes credit
export async function POST(req: Request) {
  try {
    const { resumeText, jdText, analysisId } = await req.json();
    if (!resumeText || !jdText) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 1. Consume credit: guest trial first, then logged-in
    let consumed = false;
    let guestCookieToSet: string | null = null;

    const guestCookie = req.cookies.get("guest_trial")?.value;
    if (guestCookie) {
      try {
        const { payload } = await jwtVerify(guestCookie, JWT_SECRET);
        const remaining = (payload as any).guest_resume || 0;
        if (remaining > 0) {
          consumed = true;
          // Re-sign with decremented resume, preserve interviews
          const guestInterviews = (payload as any).guest_interviews || 0;
          guestCookieToSet = await new (await import("jose")).SignJWT({
            guest_resume: remaining - 1,
            guest_interviews: guestInterviews,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(JWT_SECRET);
        }
      } catch {}
    }

    if (!consumed) {
      const email = await getCurrentUser();
      if (!email) {
        return NextResponse.json({ error: "AI深度优化需要登录或体验码" }, { status: 401 });
      }
      const e = await getEntitlements(email);
      if (e.resume_optimize_left <= 0) {
        return NextResponse.json({ error: "优化次数不足，请先兑换" }, { status: 403 });
      }
      await consumeResumeOptimize(email);
    }

    // 2. Run optimization
    const result = await rewriteResume(resumeText, jdText, true);

    // 3. Persist
    await redis.set(`rewrite:${result.id}`, JSON.stringify(result), { ex: 86400 }).catch(() => {});
    if (analysisId) {
      await redis.set(`optimize:${analysisId}`, result.id, { ex: 86400 }).catch(() => {});
    }

    const res = NextResponse.json(result);
    if (guestCookieToSet) {
      res.cookies.set("guest_trial", guestCookieToSet, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
      });
    }
    return res;
  } catch (err: any) {
    console.error("Optimize error:", err);
    return NextResponse.json({ error: err.message || "优化失败" }, { status: 500 });
  }
}
