import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";
import { recommendRoles } from "@/lib/skill-library";
import { callLLM } from "@/lib/ai";

const SESSION_TTL = 24 * 60 * 60; // 24h

interface InterviewSession {
  stage: string;
  basicInfo: Record<string, string>;
  careerTarget: Record<string, string>;
  experiences: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry;
  generatedResume: any;
  recommendations: any[];
  createdAt: number;
  updatedAt: number;
}

interface ExperienceEntry {
  id: number;
  company: string;
  role: string;
  duration: string;
  description: string;
  followups: string[];
  completed: boolean;
}

interface ProjectEntry {
  id: number;
  name: string;
  background: string;
  role: string;
  tools: string;
  results: string;
  followups: string[];
  completed: boolean;
}

interface SkillEntry {
  hardSkills: string[];
  certificates: string[];
  languages: string[];
}

function emptySession(): InterviewSession {
  return {
    stage: "BASIC_INFO",
    basicInfo: {},
    careerTarget: {},
    experiences: [],
    projects: [],
    skills: { hardSkills: [], certificates: [], languages: [] },
    generatedResume: null,
    recommendations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

async function getSession(id: string): Promise<InterviewSession | null> {
  return redis.get<InterviewSession>(`interview_gen:${id}`);
}

async function saveSession(id: string, s: InterviewSession) {
  s.updatedAt = Date.now();
  await redis.set(`interview_gen:${id}`, s, { ex: SESSION_TTL });
}

// ─── AI Follow-up Generator ──────────────────────────────────

async function generateFollowups(description: string, context: string): Promise<string[]> {
  try {
    const prompt = `你是一个专业的简历顾问。用户正在填写一段${context}经历。

根据用户已写的内容，找出 STAR 法则中缺失的关键信息，生成2-3个追问。

STAR检查清单：
- 有没有具体职责描述？
- 有没有项目或成果？
- 有没有可量化的数据？
- 有没有使用的工具或方法？
- 有没有解决的问题？

用户写的内容：
"""
${description}
"""

返回严格JSON格式：{"questions": ["追问1", "追问2", "追问3"]}
追问要求：口语化、引导性强、每个不超过25字。如果信息已经很完整，返回空数组。`;

    const response = await callLLM(prompt, "你是一个专业的简历顾问。只返回JSON。");
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.questions || [];
    }
    return [];
  } catch {
    // Fallback: default STAR follow-ups
    return [
      "有没有具体的数字或成果可以补充？比如提升了X%，服务了Y人",
      "你在过程中用到了什么工具或方法？",
      "这段经历里最有挑战的部分是什么？",
    ];
  }
}

// ─── Resume Generator ────────────────────────────────────────

async function generateResume(session: InterviewSession): Promise<any> {
  const dataSummary = `
姓名: ${session.basicInfo.name}
学历: ${session.basicInfo.degree} - ${session.basicInfo.school} - ${session.basicInfo.major}
毕业时间: ${session.basicInfo.graduation}
求职状态: ${session.basicInfo.status}
意向岗位: ${session.careerTarget.role}
意向行业: ${session.careerTarget.industry}
意向城市: ${session.careerTarget.city}
薪资期望: ${session.careerTarget.salary || ""}

实习/工作经历:
${session.experiences.map((e, i) => `
${i + 1}. ${e.company} - ${e.role} (${e.duration})
   描述: ${e.description}
   追问补充: ${e.followups.join(", ")}
`).join("\n")}

项目经历:
${session.projects.map((p, i) => `
${i + 1}. ${p.name}
   背景: ${p.background}
   角色: ${p.role}
   工具: ${p.tools}
   成果: ${p.results}
`).join("\n")}

技能: ${session.skills.hardSkills.join(", ")}
证书: ${session.skills.certificates.join(", ")}
语言: ${session.skills.languages.join(", ")}
`;

  const prompt = `根据以下求职者信息，生成一份专业的求职简历。返回严格JSON格式。

${dataSummary}

请生成以下结构的JSON：
{
  "selfEvaluation": "一段100-150字的自我评价，突出核心优势和岗位匹配度",
  "education": [{"school": "", "major": "", "degree": "", "time": "", "gpa": ""}],
  "experiences": [{"company":"","title":"","time":"","bullets":["量化成果1","量化成果2"]}],
  "projects": [{"name":"","background":"","role":"","tools":"","results":["成果1","成果2"]}],
  "skills": ["技能1"],
  "certificates": ["证书1"],
  "languages": ["语言能力"]
}

规则：
1. 只基于提供的信息写，不要捏造任何数据
2. 经历类使用STAR结构写bullets，每个经历2-3条bullet
3. 数字和成果保持原样，不要夸大
4. 如果某项信息为空（如没有项目经历），对应字段返回空数组`;

  const response = await callLLM(prompt, "你是一个资深HR和简历顾问。只返回JSON格式。");
  const match = response.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  return null;
}

async function generateRecommendations(session: InterviewSession): Promise<any[]> {
  const summary = `专业:${session.basicInfo.major} 学历:${session.basicInfo.degree} 技能:${session.skills.hardSkills.join(",")}`;

  const prompt = `根据求职者信息，推荐10个最适合的岗位方向。
${summary}

返回严格JSON数组，每个元素：
{
  "role": "岗位名称",
  "industry": "推荐行业",
  "score": 85,  // 匹配度0-100
  "reason": "推荐原因（20字以内）",
  "gaps": ["需补充的能力1"]
}
只返回JSON数组，不需要其他文字。`;

  const response = await callLLM(prompt, "你是一个职业规划师。只返回JSON数组。");
  const match = response.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  return [];
}

// ─── API Handler ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, sessionId } = body;

    let session: InterviewSession;
    let id = sessionId;

    if (action === "start") {
      id = genId();
      session = emptySession();
      await saveSession(id, session);
      return NextResponse.json({
        sessionId: id,
        stage: "BASIC_INFO",
        message: "你好！我是 AI 职业师。我先帮你把简历做出来——从基本信息开始。你的姓名是？",
      });
    }

    if (!id) return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });

    const existing = await getSession(id);
    if (!existing) return NextResponse.json({ error: "会话不存在或已过期" }, { status: 404 });
    session = existing;

    // ─── action: next (submit stage data) ───
    if (action === "next") {
      const { stage, data } = body;

      switch (stage) {
        case "BASIC_INFO": {
          session.basicInfo = data;
          session.stage = "CAREER_TARGET";
          const roles = recommendRoles(data.major || "");
          await saveSession(id, session);
          return NextResponse.json({
            stage: "CAREER_TARGET",
            message: "基本信息已记录。接下来确认你的职业方向——你的意向岗位是什么？",
            suggestions: roles,
          });
        }
        case "CAREER_TARGET": {
          session.careerTarget = data;
          session.stage = "EXPERIENCE";
          await saveSession(id, session);
          return NextResponse.json({
            stage: "EXPERIENCE",
            message: "职业方向已记录。现在帮你挖掘经历——请描述你最近的一段实习或工作经历。",
          });
        }
        case "EXPERIENCE": {
          if (data.experience) {
            session.experiences.push({
              id: session.experiences.length,
              ...data.experience,
              followups: [],
              completed: !data.needFollowup,
            });
          }
          if (data.finished) {
            session.stage = "PROJECTS";
            await saveSession(id, session);
            return NextResponse.json({
              stage: "PROJECTS",
              message: "经历已记录。有项目经历要补充吗？比如课程设计、比赛项目、个人作品。",
            });
          }
          await saveSession(id, session);
          return NextResponse.json({ stage: "EXPERIENCE", ok: true });
        }
        case "PROJECTS": {
          if (data.project) {
            session.projects.push({ id: session.projects.length, ...data.project, followups: [], completed: true });
          }
          if (data.finished) {
            session.stage = "SKILLS";
            await saveSession(id, session);
            return NextResponse.json({
              stage: "SKILLS",
              message: "最后一步——确认你的技能和证书。AI 已从你的经历中提取了一些，你可以增减。",
            });
          }
          await saveSession(id, session);
          return NextResponse.json({ stage: "PROJECTS", ok: true });
        }
        case "SKILLS": {
          session.skills = data;
          await saveSession(id, session);
          return NextResponse.json({
            stage: "SKILLS",
            ok: true,
            done: true,
            message: "信息齐了！AI 正在生成你的简历...",
          });
        }
        default:
          return NextResponse.json({ error: "未知阶段" }, { status: 400 });
      }
    }

    // ─── action: followup ───
    if (action === "followup") {
      const { description, context } = body;
      const questions = await generateFollowups(description, context || "工作");
      return NextResponse.json({ questions });
    }

    // ─── action: generate ───
    if (action === "generate") {
      const [resume, recommendations] = await Promise.all([
        generateResume(session),
        generateRecommendations(session),
      ]);
      session.generatedResume = resume;
      session.recommendations = recommendations;
      await saveSession(id, session);
      return NextResponse.json({ resume, recommendations });
    }

    // ─── action: back ───
    if (action === "back") {
      const stages = ["BASIC_INFO", "CAREER_TARGET", "EXPERIENCE", "PROJECTS", "SKILLS"];
      const idx = stages.indexOf(session.stage);
      if (idx > 0) session.stage = stages[idx - 1];
      await saveSession(id, session);
      return NextResponse.json({ stage: session.stage, session });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (err: any) {
    console.error("Interview API error:", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("sessionId");
  if (!id) return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  return NextResponse.json(session);
}
