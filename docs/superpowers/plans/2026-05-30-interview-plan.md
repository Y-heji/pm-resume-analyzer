# AI 模拟面试 — 实现计划

> **Goal:** 在改写结果页底部加「模拟面试」入口，实现 Chat 风格面试交互

**Architecture:** 一个 API 路由 `/api/interview` 三种 action（start/answer/end），面试引擎 `lib/interview.ts` 管理 State Machine，前端 Chat UI `app/interview/[id]/page.tsx`

**Tech Stack:** Next.js 16, TypeScript, DeepSeek API, Tailwind CSS

---

### Task 1: 面试引擎 (`lib/interview.ts`)

**Files:**
- Create: `lib/interview.ts`

- [ ] **Step 1: 定义类型和 state machine**

```typescript
import OpenAI from "openai";

// ─── Types ──────────────────────────────────────

interface InterviewQuestion {
  id: number;
  type: "hr" | "professional";
  question: string;
  answer: string;
  followUps: { question: string; answer: string }[];
  score?: {
    professionalism: number;
    expression: number;
    logic: number;
    structure: number;
    match: number;
    total: number;
    deductionReason: string;
  };
}

export interface InterviewSession {
  id: string;
  resumeText: string;
  jdText: string;
  tier: "free" | "paid";
  plan: {
    difficulty: string;
    duration: string;
    questionCount: number;
    focusAreas: string[];
  };
  questions: InterviewQuestion[];
  currentStep: number; // 当前进行到第几步（0 = 还没开始，1+ = 第N题）
  status: "active" | "completed";
  createdAt: string;
}
```

- [ ] **Step 2: 实现 session 存储和读取**

```typescript
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "interviews");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveSession(session: InterviewSession) {
  ensureDir();
  fs.writeFileSync(
    path.join(DATA_DIR, `${session.id}.json`),
    JSON.stringify(session, null, 2),
    "utf-8"
  );
}

export function loadSession(id: string): InterviewSession | null {
  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
```

- [ ] **Step 3: 实现 getClient**

```typescript
let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY || "",
    });
  }
  return _client;
}
```

- [ ] **Step 4: 实现 startInterview**

```typescript
export async function startInterview(
  resumeText: string,
  jdText: string,
  tier: "free" | "paid"
): Promise<{ session: InterviewSession; firstQuestion: string }> {
  const questionCount = tier === "paid" ? 8 + Math.floor(Math.random() * 5) : 5; // 8-12 or 5

  const systemPrompt = `你是资深HR+${jdText.slice(0, 50)}领域面试官。根据用户简历和岗位生成个性化面试方案。
问题必须基于用户真实经历，不套模板。第一题是轻松开场题（如自我介绍/过往经历）。`;

  const userPrompt = `=== 简历 ===
${resumeText}
=== 目标岗位 ===
${jdText}
=== 模式 ===
${tier === "paid" ? "HR+专业深度面试，8-12题" : "基础HR面试，5题"}
返回 JSON（不要 markdown）：
{"plan":{"difficulty":"初级/中级/高级","duration":"约X分钟","questionCount":${questionCount},"focusAreas":["考察点1","考察点2"]},"firstQuestion":{"type":"hr","question":"第1题内容"}}`;

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
  const parsed = JSON.parse(jsonStr);

  const session: InterviewSession = {
    id: crypto.randomUUID(),
    resumeText,
    jdText,
    tier,
    plan: parsed.plan,
    questions: [],
    currentStep: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  if (tier === "paid") saveSession(session);

  return { session, firstQuestion: parsed.firstQuestion.question };
}
```

- [ ] **Step 5: 实现 submitAnswer**

```typescript
export async function submitAnswer(
  session: InterviewSession,
  answer: string
): Promise<{
  action: "followUp" | "nextQuestion" | "end";
  question?: string;
  feedback?: string;
  session: InterviewSession;
}> {
  // Build conversation history
  const history = session.questions.map(q => ({
    question: q.question,
    answer: q.answer,
    followUps: q.followUps,
  }));

  const userPrompt = `你是面试官。当前面试状态：
- 进度：第 ${session.currentStep + 1}/${session.plan.questionCount} 题
- 模式：${session.tier === "paid" ? "HR+专业混合" : "基础HR"}
- 已答题数：${session.questions.length}

历史对话：${JSON.stringify(history, null, 2)}

用户刚才对"${history[history.length - 1]?.question}"的回答：${answer}

判断下一步：
- 回答不够深入 → 追问1次（深挖数据/逻辑/细节）
- 回答充分但有下一题 → 出新题
- 完成所有 ${session.plan.questionCount} 题 → 结束

返回 JSON：
{"action":"followUp|nextQuestion|end","question":"追问/下一题内容","feedback":"对你回答的简短反馈"}`;

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "你是资深面试官。根据对话历史自然推进面试。追问要有针对性，新题要基于用户真实经历。" },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
  const parsed = JSON.parse(jsonStr);

  // Update session
  const lastQ = session.questions[session.questions.length - 1];
  if (parsed.action === "followUp" && lastQ) {
    lastQ.answer = answer;
    lastQ.followUps.push({ question: parsed.question, answer: "" });
  } else if (parsed.action === "nextQuestion") {
    lastQ.answer = answer;
    session.currentStep++;
    session.questions.push({
      id: session.currentStep,
      type: session.currentStep <= 2 ? "hr" : "professional",
      question: parsed.question,
      answer: "",
      followUps: [],
    });
  } else if (parsed.action === "end") {
    lastQ.answer = answer;
    session.status = "completed";
  }

  if (session.tier === "paid") saveSession(session);

  return { action: parsed.action, question: parsed.question, feedback: parsed.feedback, session };
}
```

- [ ] **Step 6: 实现 endInterview（评分+报告）**

```typescript
export async function endInterview(
  session: InterviewSession
): Promise<{
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  report?: {
    scores: any[];
    frequentMistakes: string[];
    suggestedAnswers: { questionId: number; suggestion: string }[];
    learningDirection: string[];
    passProbability: string;
  };
}> {
  const paid = session.tier === "paid";
  const qa = session.questions.map(q => ({
    id: q.id,
    type: q.type,
    question: q.question,
    answer: q.answer || "(未回答)",
    followUps: q.followUps,
  }));

  const userPrompt = `面试完成。所有问答如下：
${JSON.stringify(qa, null, 2)}
岗位：${session.jdText}

${paid ? "请逐题评分（5维度：专业能力/表达能力/逻辑能力/结构化思维/岗位匹配度，各0-100），并输出完整报告。" : "请输出基础评分和建议。"}

返回 JSON：${paid ? `{"totalScore":0-100,"scores":[{"questionId":1,"professionalism":0,"expression":0,"logic":0,"structure":0,"match":0,"total":0,"deductionReason":""}],"strengths":[],"weaknesses":[],"frequentMistakes":[],"suggestedAnswers":[{"questionId":1,"suggestion":""}],"learningDirection":[],"passProbability":"30%/50%/70%/85%"}` : `{"totalScore":0-100,"strengths":[],"weaknesses":[],"suggestions":[]}`}`;

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "你是资深面试官，请客观评分。不虚高不压低。付费版给出详细分析，免费版给出基础建议。" },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: paid ? 4000 : 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
  return JSON.parse(jsonStr);
}
```

---

### Task 2: 面试 API (`app/api/interview/route.ts`)

**Files:**
- Create: `app/api/interview/route.ts`

- [ ] **Step 1: 创建 API 路由**

```typescript
import { NextResponse } from "next/server";
import { startInterview, submitAnswer, endInterview, loadSession, type InterviewSession } from "@/lib/interview";

// In-memory session cache for free tier (no file persistence)
const freeSessions = new Map<string, InterviewSession>();

export async function POST(req: Request) {
  try {
    const { action, sessionId, resumeText, jdText, deep, answer } = await req.json();

    if (action === "start") {
      if (!resumeText || !jdText) {
        return NextResponse.json({ error: "缺少简历或岗位信息" }, { status: 400 });
      }
      const tier = deep ? "paid" : "free";
      const { session, firstQuestion } = await startInterview(resumeText, jdText, tier);
      if (tier === "free") {
        freeSessions.set(session.id, session);
      }
      return NextResponse.json({ sessionId: session.id, plan: session.plan, question: firstQuestion, step: 1 });
    }

    if (action === "answer") {
      if (!sessionId || !answer) {
        return NextResponse.json({ error: "缺少 sessionId 或 answer" }, { status: 400 });
      }
      let session = loadSession(sessionId) || freeSessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

      const result = await submitAnswer(session, answer);
      // Update cache for free sessions
      if (session.tier === "free") {
        freeSessions.set(sessionId, result.session);
      }
      return NextResponse.json({
        action: result.action,
        question: result.question,
        feedback: result.feedback,
        step: result.session.currentStep + 1,
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
```

---

### Task 3: 面试页面 (`app/interview/[id]/page.tsx`)

**Files:**
- Create: `app/interview/[id]/page.tsx`

- [ ] **Step 1: Chat UI 组件**

完整的客户端组件，包含：

```
- 状态管理：loading / active / report / error
- start 时：读取 sessionStorage 获取 resumeText + jdText + deep flag，调用 API start
- active 时：Chat 对话流（AI 气泡 + 用户气泡），底部输入框 + Enter 发送
- report 时：评分卡片 + 优劣势 + 建议列表
- 免费版5题结束自动 call end，付费版显示"结束面试"按钮
```

关键代码骨架：

```typescript
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
  const [plan, setPlan] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [total, setTotal] = useState(5);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDeep = typeof window !== "undefined" && sessionStorage.getItem(`${id}_deep`) === "1";
  const tier = isDeep ? "paid" : "free";

  // Start interview on mount
  useEffect(() => {
    const resumeText = sessionStorage.getItem(`${id}_resume`);
    const jdText = sessionStorage.getItem(`${id}_jd`);
    if (!resumeText || !jdText) { setError("未找到简历数据"); setPhase("error"); return; }

    fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", resumeText, jdText, deep: isDeep }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSessionId(data.sessionId);
        setPlan(data.plan);
        setTotal(data.plan.questionCount);
        setStep(data.step);
        setMessages([{ role: "ai", text: data.question }]);
        setPhase("active");
      })
      .catch(err => { setError(err.message); setPhase("error"); });
  }, [id, isDeep]);

  // Submit answer
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

      if (data.feedback) {
        setMessages(prev => [...prev, { role: "ai", text: data.feedback }]);
      }
      if (data.question) {
        setMessages(prev => [...prev, { role: "ai", text: data.question }]);
      }
      setStep(data.step);

      if (data.action === "end") {
        handleEnd();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", text: "抱歉，出了点问题，请重试。" }]);
    } finally {
      setSubmitting(false);
    }
  };

  // End interview
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
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Render ──────────────────────────────────

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
        <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-blue-600">返回改写结果</button>
      </div>
    );
  }

  if (phase === "report" && report) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-xl font-bold mb-6">面试报告</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-blue-600">{report.totalScore}</p>
            <p className="text-xs text-gray-400">综合评分</p>
          </div>
          {report.strengths?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-emerald-600 mb-1">优势</p>
              {report.strengths.map((s: string, i: number) => <p key={i} className="text-sm text-gray-600">+ {s}</p>)}
            </div>
          )}
          {report.weaknesses?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-red-400 mb-1">需改进</p>
              {report.weaknesses.map((w: string, i: number) => <p key={i} className="text-sm text-gray-600">- {w}</p>)}
            </div>
          )}
          {report.suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-1">建议</p>
              {report.suggestions.map((s: string, i: number) => <p key={i} className="text-sm text-gray-600">{i + 1}. {s}</p>)}
            </div>
          )}
          {report.passProbability && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">面试通过概率评估</p>
              <p className="text-lg font-bold text-blue-600">{report.passProbability}</p>
            </div>
          )}
        </div>
        <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-blue-600">返回改写结果</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button onClick={() => router.push(`/rewrite/${id}`)} className="text-sm text-gray-500">← 返回</button>
        <span className="text-sm font-medium">模拟面试 · {tier === "paid" ? "专业版" : "基础版"}</span>
        <span className="text-xs text-gray-400">{step}/{total}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-gray-100 rounded mb-4 shrink-0">
        <div className="h-full bg-blue-600 rounded transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}>
              {msg.role === "ai" && <span className="text-xs text-gray-400 mr-1">🤖</span>}
              {msg.text}
            </div>
          </div>
        ))}
        {submitting && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400">
              <span className="animate-pulse">面试官思考中...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="输入你的回答..."
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !input.trim()}
            className="px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            发送
          </button>
        </div>
        {tier === "paid" && step >= total && (
          <button
            onClick={handleEnd}
            className="w-full mt-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            结束面试，查看报告
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Task 4: 改写页加入口 (`app/rewrite/[id]/page.tsx`)

**Files:**
- Modify: `app/rewrite/[id]/page.tsx`

- [ ] **Step 1: 在底部操作栏加「模拟面试」按钮**

在"预览并导出 PDF"和"返回分析报告"之间插入：

```tsx
<button
  onClick={() => router.push(`/interview/${id}`)}
  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
  模拟面试
</button>
```

---

## 验证

1. `npm run build` 零错误
2. 上传简历 → 分析 → 改写 → 点击「模拟面试」
3. 免费版：5题 + 追问 + 基础报告
4. `/analyze?deep=1` 付费版：8-12题 + 深度评分 + 完整报告
5. `data/interviews/` 下付费版会话有 JSON 文件
