import { NextResponse } from "next/server";
import { startInterview, submitAnswer, endInterview, loadSession, saveSession, saveInterviewHistory, getInterviewHistory, type InterviewSession } from "@/lib/interview";
import { getCurrentUser, verifyToken } from "@/lib/auth";
import { getEntitlements, consumeMockInterview } from "@/lib/credits";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "pm-resume-jwt-2026-heji-secret-key");

const freeSessions = new Map<string, InterviewSession>();

export async function POST(req: Request) {
  try {
    const { action, sessionId, resumeText, jdText, deep, answer } = await req.json();

    if (action === "start") {
      if (!resumeText || !jdText) {
        return NextResponse.json({ error: "缺少简历或岗位信息" }, { status: 400 });
      }
      const tier = deep ? "paid" : "free";

      let res: NextResponse | null = null;

      // Paid tier: check guest trial cookie first, then regular entitlements
      if (tier === "paid") {
        const guestCookie = req.cookies.get("guest_trial")?.value;
        let guestConsumed = false;

        if (guestCookie) {
          try {
            const verified = await verifyToken(guestCookie);
            // Use a different JWT secret verification via jose directly
            const { jwtVerify } = await import("jose");
            const { payload } = await jwtVerify(guestCookie, JWT_SECRET);
            const remaining = (payload as any).guest_interviews || 0;

            if (remaining > 0) {
              // Preserve all guest credits, only decrement interviews
              const guestResume = (payload as any).guest_resume || 0;
              const newToken = await new SignJWT({
                guest_resume: guestResume,
                guest_interviews: remaining - 1,
              })
                .setProtectedHeader({ alg: "HS256" })
                .setExpirationTime("24h")
                .sign(JWT_SECRET);

              res = NextResponse.json(null); // placeholder, will fill in after startInterview
              res.cookies.set("guest_trial", newToken, {
                httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
              });
              guestConsumed = true;
            }
          } catch {
            // Invalid/expired guest token — ignore
          }
        }

        // If no guest trial, try logged-in entitlements
        if (!guestConsumed) {
          const email = await getCurrentUser();
          if (email) {
            const e = await getEntitlements(email);
            if (e.status === "expired") {
              return NextResponse.json({ error: "你的专业版次数已用完，请重新激活", status: "expired" }, { status: 403 });
            }
            if (e.mock_interview_left > 0) {
              await consumeMockInterview(email);
            } else {
              return NextResponse.json({ error: "面试次数不足，请先兑换" }, { status: 403 });
            }
          }
          // Not logged in and no guest cookie → deny
          if (!guestConsumed && !email) {
            return NextResponse.json({ error: "深度面试需要先登录或激活体验码" }, { status: 403 });
          }
        }
      }

      const { session, firstQuestion } = await startInterview(resumeText, jdText, tier);
      if (tier === "free") { freeSessions.set(session.id, session); saveSession(session); }

      if (res) {
        // Re-create response with actual body
        return new NextResponse(
          JSON.stringify({
            sessionId: session.id,
            plan: session.plan,
            question: firstQuestion,
            step: 1,
            total: session.plan.questionCount,
          }),
          {
            status: 200,
            headers: res.headers,
          }
        );
      }

      return NextResponse.json({
        sessionId: session.id,
        plan: session.plan,
        question: firstQuestion,
        step: 1,
        total: session.plan.questionCount,
      });
    }

    if (action === "answer") {
      if (!sessionId || !answer) {
        return NextResponse.json({ error: "缺少 sessionId 或 answer" }, { status: 400 });
      }
      let session = (await loadSession(sessionId)) || freeSessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
      if (session.status === "completed") {
        return NextResponse.json({ action: "end", step: session.currentStep, total: session.plan.questionCount });
      }

      const result = await submitAnswer(session, answer);
      if (session.tier === "free") { freeSessions.set(sessionId, result.session); saveSession(result.session); }

      return NextResponse.json({
        action: result.action,
        question: result.question,
        feedback: result.feedback,
        step: result.session.currentStep,
        total: result.session.plan.questionCount,
      });
    }

    if (action === "end") {
      if (!sessionId) return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
      let session = (await loadSession(sessionId)) || freeSessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

      session.status = "completed";
      const report = await endInterview(session);

      // Save to history if logged in
      const email = await getCurrentUser();
      if (email) await saveInterviewHistory(email, session, report).catch(() => {});

      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (err: any) {
    console.error("Interview error:", err);
    return NextResponse.json({ error: err.message || "面试出错" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const email = await getCurrentUser();
    if (!email) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const history = await getInterviewHistory(email);
    return NextResponse.json({ history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
