import { NextResponse } from "next/server";
import { startInterview, submitAnswer, endInterview, loadSession, type InterviewSession } from "@/lib/interview";
import { getCurrentUser } from "@/lib/auth";
import { getEntitlements, consumeMockInterview } from "@/lib/credits";

const freeSessions = new Map<string, InterviewSession>();

export async function POST(req: Request) {
  try {
    const { action, sessionId, resumeText, jdText, deep, answer, guest } = await req.json();

    if (action === "start") {
      if (!resumeText || !jdText) {
        return NextResponse.json({ error: "缺少简历或岗位信息" }, { status: 400 });
      }
      const tier = deep ? "paid" : "free";

      // Paid tier: consume from logged-in user, but NOT if using guest trial
      if (tier === "paid" && !guest) {
        const email = await getCurrentUser();
        if (email) {
          const e = await getEntitlements(email);
          if (e.mock_interview_left > 0) {
            await consumeMockInterview(email);
          } else {
            return NextResponse.json({ error: "面试次数不足，请先兑换" }, { status: 403 });
          }
        }
      }

      const { session, firstQuestion } = await startInterview(resumeText, jdText, tier);
      if (tier === "free") freeSessions.set(session.id, session);
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
      let session = loadSession(sessionId) || freeSessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
      if (session.status === "completed") {
        return NextResponse.json({ action: "end", step: session.currentStep, total: session.plan.questionCount });
      }

      const result = await submitAnswer(session, answer);
      if (session.tier === "free") freeSessions.set(sessionId, result.session);

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
      let session = loadSession(sessionId) || freeSessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

      session.status = "completed";
      const report = await endInterview(session);
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (err: any) {
    console.error("Interview error:", err);
    return NextResponse.json({ error: err.message || "面试出错" }, { status: 500 });
  }
}
