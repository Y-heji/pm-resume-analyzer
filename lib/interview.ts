import OpenAI from "openai";
import { extractJson } from "./json-utils";
import { getAIClient } from "./ai-config";
import { getQuestionsForCategory } from "./interview-questions";
import { redis } from "./auth";

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

// ─── In-memory Storage ──────────────────────────

const sessionStore = new Map<string, InterviewSession>();

export function saveSession(session: InterviewSession) {
  sessionStore.set(session.id, session);
}

export function loadSession(id: string): InterviewSession | null {
  return sessionStore.get(id) || null;
}

// ─── History (Redis persistence for completed interviews) ──

export async function saveInterviewHistory(
  email: string,
  session: InterviewSession,
  report?: any
): Promise<void> {
  const key = `interview_history:${email}`;
  const entry = {
    id: session.id,
    createdAt: session.createdAt,
    plan: session.plan,
    questionCount: session.questions.length,
    tier: session.tier,
    report: report ? { totalScore: report.totalScore, passProbability: report.passProbability } : null,
  };
  await redis.lpush(key, entry);
  await redis.ltrim(key, 0, 49); // keep last 50
}

export async function getInterviewHistory(email: string): Promise<any[]> {
  const key = `interview_history:${email}`;
  const raw = await redis.lrange(key, 0, -1);
  return (raw || []) as any[];
}

// ─── AI Client ──────────────────────────────────

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) _client = getAIClient();
  return _client;
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
  const bankQuestions = getQuestionsForCategory("hr").map(q => q.question).join("\n");

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `你是资深HR面试官，正对候选人进行面试。你需要深度阅读候选人简历，提出5个针对性问题。每个问题之后会有一个追问来深挖细节。

参考题库（借鉴思路，个性化出题）：
${bankQuestions}

要求：每个问题必须引用简历中的具体项目或经历，让候选人感受到面试官认真看了简历。`,
      },
      {
        role: "user",
        content: `=== 候选人简历 ===\n${resumeText}\n=== 目标岗位 ===\n${jdText}\n\n你是专业HR，请从以下角度各出1题，每题必须引用简历中的具体经历：\n1. 自我介绍与岗位匹配度\n2. 核心专业能力考察\n3. 项目经历深挖\n4. 问题解决与应变能力\n5. 职业规划与求职动机\n\n每题30-50字，具体、个性化。返回JSON：{"plan":{"difficulty":"初/中/高级","duration":"约10分钟","questionCount":5,"focusAreas":["岗位匹配","核心能力","项目经验","问题解决","职业规划"]},"questions":[{"type":"hr","question":"Q1"},{"type":"hr","question":"Q2"},{"type":"hr","question":"Q3"},{"type":"hr","question":"Q4"},{"type":"hr","question":"Q5"}]}`,
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

// Free: 5 questions, each with 1 HR follow-up
async function answerFree(
  session: InterviewSession,
  answer: string
): Promise<{ action: "nextQuestion" | "end"; question?: string; feedback?: string; session: InterviewSession }> {
  const lastQ = session.questions[session.questions.length - 1];
  const followUpCount = lastQ?.followUps.length || 0;

  // Save answer to current question or follow-up
  if (followUpCount > 0) {
    // Answering a follow-up
    const lastFollowUp = lastQ.followUps[followUpCount - 1];
    if (lastFollowUp) lastFollowUp.answer = answer;
  } else {
    // Answering main question
    if (lastQ) lastQ.answer = answer;
  }

  // After answering main question → generate 1 follow-up
  if (followUpCount === 0) {
    const response = await getClient().chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是专业HR面试官。基于候选人的回答，追问1个具体细节（数据/逻辑/做法），深挖真实能力。追问要简短有力，不超过30字。用JSON回复。" },
        {
          role: "user",
          content: `简历：${session.resumeText.slice(0, 500)}\n岗位：${session.jdText}\n当前问题：${lastQ?.question}\n候选人回答：${answer}\n\n请给出10字以内简短肯定，然后追问1个具体问题。\n返回JSON：{"feedback":"简短反馈","question":"追问问题"}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(extractJson(text));
    if (lastQ) lastQ.followUps.push({ question: parsed.question, answer: "" });

    return { action: "nextQuestion", question: parsed.question, feedback: parsed.feedback, session };
  }

  // After follow-up → move to next question
  session.currentStep++;
  const step = session.currentStep;

  if (step > session.plan.questionCount) {
    session.status = "completed";
    return { action: "end", session };
  }

  // Generate next main question
  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "你是资深HR面试官。自然过渡到下一题，问题要结合简历具体经历，不同维度。用JSON回复。" },
      {
        role: "user",
        content: `简历：${session.resumeText.slice(0, 500)}\n岗位：${session.jdText}\n进度：${step}/${session.plan.questionCount}\n已回答：${session.questions.map(q => `"${q.question}" → ${q.answer}`).join(" | ")}\n\n请给一句简短反馈+第${step}题(30-50字，结合简历经历，不同维度)。\n返回JSON：{"feedback":"简短反馈","question":"新题"}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 600,
  });

  const text2 = response.choices[0]?.message?.content || "";
  const parsed2 = JSON.parse(extractJson(text2));

  session.questions.push({
    id: step,
    type: "hr",
    question: parsed2.question,
    answer: "",
    followUps: [],
  });

  return { action: "nextQuestion", question: parsed2.question, feedback: parsed2.feedback, session };
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

  const SCORING_RUBRIC = `
## 评分维度定义（0-100）

**专业能力**：回答展示的专业知识和技能深度
- 90-100：深入理解，有实际案例支撑，能讨论技术细节和行业最佳实践
- 70-89：理解正确，有具体经验，概念清晰
- 50-69：基本正确，但缺乏深度和具体案例
- 30-49：概念模糊，有错误理解
- 0-29：答非所问或完全不了解

**表达能力**：语言组织、逻辑清晰度、简洁程度
- 90-100：条理清晰，重点突出，简洁有力，善于用STAR法则
- 70-89：表达流畅，有结构，能让人理解
- 50-69：基本可理解，但啰嗦或跳跃
- 30-49：表达混乱，难以理解
- 0-29：无法正常沟通

**逻辑能力**：分析问题的框架、因果关系、推理能力
- 90-100：逻辑严密，有清晰的分析框架，能多角度思考
- 70-89：逻辑清晰，能自圆其说
- 50-69：有一定逻辑但不够深入
- 30-49：逻辑混乱或前后矛盾
- 0-29：没有逻辑

**结构化思维**：回答的组织结构、总分总、MECE等
- 90-100：结构化极好，总分总/MECE/金字塔结构明显
- 70-89：有结构，分段清晰，有总结
- 50-69：有一定分段，但结构感不强
- 30-49：缺乏结构，想到哪说到哪
- 0-29：完全没有结构

**岗位匹配度**：回答体现的对目标岗位的理解和匹配
- 90-100：精准理解岗位要求，回答完全切中要点
- 70-89：与岗位相关度高，有一定行业理解
- 50-69：部分相关，有不够匹配之处
- 30-49：与岗位关系不大
- 0-29：完全无关

## 综合评分计算
total = (专业能力 × 0.3 + 表达能力 × 0.2 + 逻辑能力 × 0.2 + 结构化思维 × 0.15 + 岗位匹配度 × 0.15)
`;

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `你是资深面试官，严格按评分标准打分。${paid ? "付费版：逐题5维度评分+逐题扣分原因+完整报告+通过概率。" : "免费版：总分+优劣+提升建议。"}评分要客观真实，80%的评分应在50-75之间，极少情况给90以上或30以下。${paid ? SCORING_RUBRIC : ""}`,
      },
      {
        role: "user",
        content: `面试完成。目标岗位：${session.jdText.slice(0, 200)}\n问答记录：${JSON.stringify(qa)}\n\n${paid ? `请严格按以下JSON格式输出（注意每个问题的5维度评分必须严谨，逐题写扣分原因）：\n{"totalScore":0-100,"scores":[{"questionId":1,"professionalism":0,"expression":0,"logic":0,"structure":0,"match":0,"total":0,"deductionReason":"具体扣分原因"}],"strengths":["回答好的地方"],"weaknesses":["需要改进的地方"],"frequentMistakes":["跨题反复出现的问题"],"suggestedAnswers":[{"questionId":1,"suggestion":"建议如何回答更好"}],"learningDirection":["具体提升建议"],"passProbability":"30%/50%/70%/85%"}` : "请输出：{\"totalScore\":0-100,\"strengths\":[\"优势\"],\"weaknesses\":[\"不足\"],\"suggestions\":[\"提升建议\"]}"}`,
      },
    ],
    temperature: 0.3,
    max_tokens: paid ? 6000 : 2000,
  });

  const text = response.choices[0]?.message?.content || "";
  const report = JSON.parse(extractJson(text));

  if (session.tier === "paid") {
    session.status = "completed";
    saveSession(session);
  }

  return report;
}
