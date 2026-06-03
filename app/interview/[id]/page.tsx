"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  role: "ai" | "user";
  text: string;
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [phase, setPhase] = useState<"loading" | "active" | "report" | "error">("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [total, setTotal] = useState(5);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDeep = typeof window !== "undefined" && (getRemainingUses() > 0 || (() => { try { const r = sessionStorage.getItem(id); return r ? !!JSON.parse(r).deepAnalysis : false; } catch { return false; } })());
  const tier = isDeep ? "paid" : "free";

  useEffect(() => {
    const resumeText = sessionStorage.getItem(`${id}_resume`);
    const jdText = sessionStorage.getItem(`${id}_jd`);
    if (!resumeText || !jdText) {
      setError("未找到简历或岗位数据，请返回重新分析");
      setPhase("error");
      return;
    }

    fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", resumeText, jdText, deep: isDeep }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSessionId(data.sessionId);
        setTotal(data.total);
        setStep(1);
        setMessages([{ role: "ai", text: data.question }]);
        setPhase("active");
      })
      .catch(err => {
        setError(err.message);
        setPhase("error");
      });
  }, [id, isDeep]);

  const handleSubmit = async () => {
    if (!input.trim() || !sessionId || submitting) return;
    const answer = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: answer }]);
    setSubmitting(true);

    try {
      const r = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", sessionId, answer }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);

      setStep(data.step);

      if (data.feedback) {
        setMessages(prev => [...prev, { role: "ai", text: data.feedback }]);
      }
      if (data.question) {
        setMessages(prev => [...prev, { role: "ai", text: data.question }]);
      }

      if (data.action === "end") {
        await handleEnd();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", text: "抱歉出错了，请重试。" }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId }),
      });
      const data = await r.json();
      setReport(data.report);
      setPhase("report");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">AI 面试官正在准备个性化面试...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-blue-600 hover:text-blue-700">返回改写结果</button>
      </div>
    );
  }

  if (phase === "report" && report) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-xl font-bold mb-6">面试报告</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{report.totalScore}</p>
            <p className="text-xs text-gray-400">综合评分</p>
          </div>
          {report.strengths?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-emerald-600 mb-1">优势</p>
              {report.strengths.map((s: string, i: number) => <p key={i} className="text-sm text-gray-600">+ {s}</p>)}
            </div>
          )}
          {report.weaknesses?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">风险点</p>
              {report.weaknesses.map((w: string, i: number) => <p key={i} className="text-sm text-gray-600">- {w}</p>)}
            </div>
          )}
          {report.suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-1">提升建议</p>
              {report.suggestions.map((s: string, i: number) => <p key={i} className="text-sm text-gray-600">{i + 1}. {s}</p>)}
            </div>
          )}
          {report.passProbability && (
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">面试通过概率评估</p>
              <p className="text-lg font-bold text-blue-600">{report.passProbability}</p>
            </div>
          )}
          {report.frequentMistakes?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-orange-500 mb-1">高频失分点</p>
              {report.frequentMistakes.map((m: string, i: number) => <p key={i} className="text-sm text-gray-600">· {m}</p>)}
            </div>
          )}
          {report.learningDirection?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-purple-600 mb-1">推荐学习方向</p>
              {report.learningDirection.map((d: string, i: number) => <p key={i} className="text-sm text-gray-600">{i + 1}. {d}</p>)}
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-blue-600 hover:text-blue-700">返回改写结果</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-4 flex flex-col h-screen">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-gray-500 hover:text-gray-700">← 返回</button>
        <span className="text-sm font-medium text-gray-700">模拟面试{tier === "paid" ? " · 专业版" : ""}</span>
        <span className="text-xs text-gray-400">{step}/{total}</span>
      </div>

      <div className="w-full h-1 bg-gray-100 rounded mb-4 shrink-0">
        <div className="h-full bg-blue-600 rounded transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
            }`}>
              {msg.role === "ai" && <span className="text-xs mr-1">🤖</span>}
              <span className="whitespace-pre-wrap">{msg.text}</span>
            </div>
          </div>
        ))}
        {submitting && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400">面试官思考中...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="shrink-0 pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder="输入你的回答... (Enter 发送)"
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button onClick={handleSubmit} disabled={submitting || !input.trim()}
            className="px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors">发送</button>
        </div>
        {tier === "paid" && messages.length > 0 && (
          <button onClick={handleEnd} disabled={submitting}
            className="w-full mt-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">结束面试，查看报告</button>
        )}
      </div>
    </div>
  );
}
