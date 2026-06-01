import OpenAI from "openai";
import fs from "fs";
import path from "path";

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
  currentStep: number;
  status: "active" | "completed";
  createdAt: string;
}

// ─── Storage ────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data", "interviews");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveSession(session: InterviewSession) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${session.id}.json`), JSON.stringify(session, null, 2), "utf-8");
}

export function loadSession(id: string): InterviewSession | null {
  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// ─── AI Client ──────────────────────────────────

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

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

// ─── Start ──────────────────────────────────────

export async function startInterview(
  resumeText: string,
  jdText: string,
  tier: "free" | "paid"
): Promise<{ session: InterviewSession; firstQuestion: string }> {
  if (tier === "free") {
    return startFree(resumeText, jdText);
  }
  return startPaid(resumeText, jdText);
}

async function startFree(
  resumeText: string,
  jdText: string
): Promise<{ session: InterviewSession; firstQuestion: string }> {
  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `你是资深HR面试官。为用户生成5个个性化面试问题。问题必须深度结合用户简历中的具体经历和岗位要求，而非通用模板。每个问题针对不同维度，让面试者感受到"这个面试官真的看了我的简历"。`,
      },
      {
        role: "user",
        content: `=== 简历 ===\n${resumeText}\n=== 岗位 ===\n${jdText}\n\n请从以下维度各出1题，每题必须引用简历中的具体经历或项目：\n1. 自我介绍与岗位理解（结合用户当前职位或最近项目）\n2. 核心能力考察（结合岗位核心要求，问一个用户简历中体现的能力）\n3. 项目深挖（选用户简历中一个具体项目深入提问）\n4. 问题解决与适应力（基于用户经历问一个挑战场景）\n5. 职业规划与自我认知\n\n每题一句话，30-50字，体现个性化。返回JSON：{"plan":{"difficulty":"初/中/高级","duration":"约8分钟","questionCount":5,"focusAreas":["岗位匹配","核心能力","项目经验","问题解决","职业规划"]},"questions":[{"type":"hr","question":"Q1"},{"type":"hr","question":"Q2"},{"type":"hr","question":"Q3"},{"type":"hr","question":"Q4"},{"type":"hr","question":"Q5"}]}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(extractJson(text));

  const firstQ = parsed.questions?.[0]?.question || "请做一下自我介绍";

  const session: InterviewSession = {
    id: crypto.randomUUID(),
    resumeText,
    jdText,
    tier: "free",
    plan: parsed.plan,
    questions: [{ id: 1, type: "hr" as const, question: firstQ, answer: "", followUps: [] }],
    currentStep: 1,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  return { session, firstQuestion: firstQ };
}

async function startPaid(
  resumeText: string,
  jdText: string
): Promise<{ session: InterviewSession; firstQuestion: string }> {
  const questionCount = 8 + Math.floor(Math.random() * 5);

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `你是资深HR+${jdText.slice(0, 50)}领域面试官。前3题为基础HR面试（自我介绍+动机+软技能），后面全部是针对${jdText.slice(0, 30)}岗位的专业深度题。问题基于用户真实经历深度定制。`,
      },
      {
        role: "user",
        content: `=== 简历 ===\n${resumeText}\n=== 岗位 ===\n${jdText}\n生成${questionCount}题的专业深度面试方案。前3题HR方向，后续全部岗位专业方向。\n返回JSON（不要markdown）：{"plan":{"difficulty":"初级/中级/高级","duration":"约15-20分钟","questionCount":${questionCount},"focusAreas":["HR基础","岗位专业","项目深挖","业务理解"]},"firstQuestion":{"type":"hr","question":"第1题（自我介绍+岗位理解）"}}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(extractJson(text));

  const firstQ = parsed.firstQuestion.question;

  const session: InterviewSession = {
    id: crypto.randomUUID(),
    resumeText,
    jdText,
    tier: "paid",
    plan: parsed.plan,
    questions: [{ id: 1, type: parsed.firstQuestion?.type || "hr", question: firstQ, answer: "", followUps: [] }],
    currentStep: 1,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return { session, firstQuestion: firstQ };
}

// ─── Submit Answer ──────────────────────────────

// ─── Submit Answer ──────────────────────────────

export async function submitAnswer(
  session: InterviewSession,
  answer: string
): Promise<{
  action: "nextQuestion" | "end";
  question?: string;
  feedback?: string;
  session: InterviewSession;
}> {
  if (session.tier === "free") {
    return answerFree(session, answer);
  }
  return answerPaid(session, answer);
}

// Free: no follow-ups, just save answer and move to next question
async function answerFree(
  session: InterviewSession,
  answer: string
): Promise<{ action: "nextQuestion" | "end"; question?: string; feedback?: string; session: InterviewSession }> {
  // Save current answer
  const lastQ = session.questions[session.questions.length - 1];
  if (lastQ) lastQ.answer = answer;

  session.currentStep++;
  const step = session.currentStep;

  if (step >= session.plan.questionCount) {
    session.status = "completed";
    return { action: "end", session };
  }

  // Get next question with natural transition
  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "你是HR面试官。根据用户回答给出10字以内简短肯定(如'了解了''说得很清楚')，然后自然过渡到下一题。不重复已问维度。用JSON回复。" },
      {
        role: "user",
        content: `简历：${session.resumeText.slice(0, 500)}\n岗位：${session.jdText}\n进度：${step}/${session.plan.questionCount}\n已回答：${session.questions.map(q => `"${q.question}" → ${q.answer}`).join(" | ")}\n\n请给一句简短反馈+第${step + 1}题(30-50字，结合简历具体经历，不同维度)。\n返回JSON：{"feedback":"简短反馈","question":"新题"}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 600,
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(extractJson(text));

  session.questions.push({
    id: step + 1,
    type: "hr",
    question: parsed.question,
    answer: "",
    followUps: [],
  });

  return { action: "nextQuestion", question: parsed.question, feedback: parsed.feedback, session };
}

// Paid: can follow up, deep dive into experience
async function answerPaid(
  session: InterviewSession,
  answer: string
): Promise<{ action: "nextQuestion" | "end"; question?: string; feedback?: string; session: InterviewSession }> {
  const history = session.questions.map(q => {
    const fups = q.followUps.map((f, fi) => `  追问${fi + 1}: ${f.question}\n  回答${fi + 1}: ${f.answer || "(未回答)"}`).join("\n");
    return `Q${q.id}[${q.type}]: ${q.question}\nA${q.id}: ${q.answer || "(未回答)"}${fups ? "\n" + fups : ""}`;
  });

  const lastQ = session.questions[session.questions.length - 1];
  const lastFollowUp = lastQ?.followUps[lastQ.followUps.length - 1];
  const currentQ = lastFollowUp?.question || lastQ?.question || "";
  const followUpCount = lastQ?.followUps.length || 0;

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: "你是资深面试官。自然地推进面试。追问要针对回答中的细节深挖（数据/逻辑/具体做法），让面试者展示真实能力。新题要基于用户真实经历。每题最多追问2次。",
      },
      {
        role: "user",
        content: `进度：第${session.currentStep}/${session.plan.questionCount}题 | 当前题追问${followUpCount}/2次\n\n对话历史：\n${history.join("\n\n")}\n\n用户最新回答("${currentQ}")：${answer}\n\n判断：\n- 回答不够深入且追问<2次 → action:followUp 追问具体细节\n- 回答充分 → action:nextQuestion 出新题(${session.currentStep < 3 ? "HR方向" : "岗位专业方向"})\n- 已回答${session.plan.questionCount}题 → action:end\n\n返回JSON：{"action":"followUp|nextQuestion|end","question":"追问/新题内容","feedback":"过渡语(可为空)"}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(extractJson(text));

  if (parsed.action === "followUp") {
    if (lastFollowUp) {
      lastFollowUp.answer = answer;
    } else if (lastQ) {
      lastQ.answer = answer;
    }
    if (lastQ) {
      lastQ.followUps.push({ question: parsed.question, answer: "" });
    }
  } else if (parsed.action === "nextQuestion") {
    if (lastFollowUp) {
      lastFollowUp.answer = answer;
    } else if (lastQ) {
      lastQ.answer = answer;
    }
    session.currentStep++;
    session.questions.push({
      id: session.currentStep,
      type: session.currentStep <= 3 ? "hr" : "professional",
      question: parsed.question,
      answer: "",
      followUps: [],
    });
  } else {
    if (lastFollowUp) {
      lastFollowUp.answer = answer;
    } else if (lastQ) {
      lastQ.answer = answer;
    }
    session.status = "completed";
  }

  if (session.tier === "paid") saveSession(session);

  return { action: parsed.action === "end" ? "end" : "nextQuestion", question: parsed.question, feedback: parsed.feedback, session };
}

// ─── End / Scoring ──────────────────────────────

export async function endInterview(session: InterviewSession): Promise<{
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

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `你是资深面试官，客观评分。${paid ? "付费版输出5维度评分+完整报告+通过概率。" : "免费版输出总分+优劣+建议。"}不虚高不压低。`,
      },
      {
        role: "user",
        content: `面试完成。岗位：${session.jdText}\n问答：${JSON.stringify(qa)}\n\n${paid ? "请逐题评分（5维度0-100：专业能力/表达能力/逻辑能力/结构化思维/岗位匹配度+扣分原因），输出：{\"totalScore\":0-100,\"scores\":[{\"questionId\":1,\"professionalism\":0,\"expression\":0,\"logic\":0,\"structure\":0,\"match\":0,\"total\":0,\"deductionReason\":\"\"}],\"strengths\":[],\"weaknesses\":[],\"frequentMistakes\":[],\"suggestedAnswers\":[{\"questionId\":1,\"suggestion\":\"\"}],\"learningDirection\":[],\"passProbability\":\"30%/50%/70%/85%\"}" : "输出：{\"totalScore\":0-100,\"strengths\":[],\"weaknesses\":[],\"suggestions\":[]}"}`,
      },
    ],
    temperature: 0.3,
    max_tokens: paid ? 4000 : 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const report = JSON.parse(extractJson(text));

  if (session.tier === "paid") {
    session.status = "completed";
    saveSession(session);
  }

  return report;
}
