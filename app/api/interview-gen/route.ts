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
  const bi = session.basicInfo;
  const ct = session.careerTarget;
  const certs = Array.isArray(session.skills.certificates) ? session.skills.certificates
    : (session.skills.certificates ? [session.skills.certificates] : []);
  const langs = Array.isArray(session.skills.languages) ? session.skills.languages
    : (session.skills.languages ? [session.skills.languages] : []);

  // Build experiences from raw data — AI only optimizes bullets, never changes names
  const experiences = session.experiences.map(e => ({
    company: e.company,
    title: e.role,
    time: e.duration,
    description: e.description,
    followups: e.followups || [],
  }));

  // Build projects from raw data
  const projects = session.projects.map(p => ({
    name: p.name,
    background: p.background,
    role: p.role,
    tools: p.tools,
    results: p.results,
  }));

  // Build education from raw data
  const education = [{
    school: bi.school || "",
    major: bi.major || "",
    degree: bi.degree || "",
    time: bi.graduation ? `2021.09 - ${bi.graduation}` : "",
    gpa: "",
  }];

  // ─── AI only for: self-evaluation + bullet optimization ───
  const dataSummary = `
姓名: ${bi.name}
学历: ${bi.degree} · ${bi.school} · ${bi.major} · ${bi.graduation}
意向岗位: ${ct.role} · ${ct.industry} · ${ct.city}

经历:
${experiences.map((e, i) => `
${i+1}. ${e.company} - ${e.title} (${e.time})
  描述: ${e.description}
  追问: ${e.followups.join("; ")}
`).join("\n")}

项目:
${projects.map((p, i) => `
${i+1}. ${p.name}
  角色: ${p.role} · 工具: ${p.tools}
  成果: ${p.results}
`).join("\n")}

技能: ${session.skills.hardSkills.join(", ")}
证书: ${certs.join(", ")}
语言: ${langs.join(", ")}
`;

  const prompt = `你是简历优化师。用户是${bi.graduation ? "应届生（" + bi.graduation + "毕业）" : "求职者"}，目标${ct.role}。

写一段100-150字自我评价。实事求是，不编工作年限，不编公司名，不编数据。返回JSON：{"selfEvaluation":"..."}`;

  let selfEvaluation = "";
  try {
    const resp = await callLLM(prompt, "你是简历顾问。只返回JSON。");
    const m = resp.match(/\{[\s\S]*\}/);
    if (m) selfEvaluation = JSON.parse(m[0]).selfEvaluation || "";
  } catch {}

  if (!selfEvaluation) {
    selfEvaluation = `${bi.name}，${bi.school}${bi.major}${bi.degree}，意向${ct.role}。具备${session.skills.hardSkills.slice(0,3).join("、")}等技能。`;
  }

  // ─── Data from user input — NO AI ───
  const finalExperiences = experiences.map(e => ({
    company: e.company,
    title: e.title,
    time: e.time,
    bullets: e.description
      .split(/[。；;]/).map((b: string) => b.trim()).filter((b: string) => b.length > 4),
  }));

  const finalProjects = projects.map(p => ({
    name: p.name,
    role: p.role,
    tools: p.tools,
    results: p.results ? [p.results] : [],
  }));

  // ─── FinalResume for PDF export ───
  const finalResume = {
    header: {
      name: bi.name || "",
      role: ct.role || "求职者",
      contact: [bi.phone, bi.email].filter(Boolean).join(" | "),
      subtitle: [bi.school, bi.major, bi.degree, bi.birth ? bi.birth : null, ct.city].filter(Boolean).join(" · "),
    },
    summary: selfEvaluation,
    sections: [
      ...(finalExperiences.length > 0 ? [{
        label: "工作经历",
        entries: finalExperiences.map(e => ({
          title: `${e.title || ""} · ${e.company || ""}`,
          subtitle: e.time || "",
          bullets: e.bullets,
        })),
      }] : []),
      ...(finalProjects.length > 0 ? [{
        label: "项目经验",
        entries: finalProjects.map(p => ({
          title: p.name || "",
          subtitle: [p.role, p.tools].filter(Boolean).join(" · "),
          bullets: p.results,
        })),
      }] : []),
      ...(certs.length > 0 || langs.length > 0 ? [{
        label: "证书与语言",
        entries: [{
          title: [certs.join(" · "), langs.join(" · ")].filter(Boolean).join(" | "),
          subtitle: "",
          bullets: [],
        }],
      }] : []),
    ].filter(s => s.entries.length > 0),
    skills: session.skills.hardSkills,
    education: {
      school: bi.school || "",
      degree: bi.degree || "",
      year: bi.graduation || "",
    },
  };

  // Plain-text for rewrite module
  const resumeText = [
    `# ${bi.name || "简历"}`,
    education[0].school ? `## 教育经历\n${education[0].school} · ${education[0].major} · ${education[0].degree} · ${education[0].time}` : "",
    ...finalExperiences.map(e =>
      `## ${e.company} - ${e.title} (${e.time})\n${e.bullets.map(b => `- ${b}`).join("\n")}`
    ),
    ...finalProjects.map(p =>
      `## 项目: ${p.name}\n${p.results.map((r: string) => `- ${r}`).join("\n")}`
    ),
    `## 技能\n${session.skills.hardSkills.join(" · ")}`,
    certs.length ? `## 证书\n${certs.join(" · ")}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    selfEvaluation,
    education,
    experiences: finalExperiences,
    projects: finalProjects,
    skills: session.skills.hardSkills,
    certificates: certs,
    languages: langs,
    finalResume,
    resumeText,
  };
}

async function generateRecommendations(session: InterviewSession): Promise<any[]> {
  const bi = session.basicInfo;
  const ct = session.careerTarget;
  const exps = session.experiences.map(e => `${e.company} ${e.role}: ${e.description}`).join("; ");
  const projs = session.projects.map(p => `${p.name}(${p.role},${p.tools}): ${p.results}`).join("; ");

  const summary = [
    `意向岗位: ${ct.role || "未指定"}`,
    `意向行业: ${ct.industry || "未指定"}`,
    `意向城市: ${ct.city || "未指定"}`,
    `专业: ${bi.major} | 学历: ${bi.degree} | 学校: ${bi.school}`,
    `技能: ${session.skills.hardSkills.join(", ")}`,
    `工作经历: ${exps || "无"}`,
    `项目经历: ${projs || "无"}`,
  ].join("\n");

  const prompt = `你是职业规划师。根据以下求职者完整信息，推荐10个最适合的岗位方向。
优先匹配「意向岗位」，再根据专业/技能/经历拓展相关方向。

${summary}

返回JSON数组：[{"role":"岗位","industry":"行业","score":85,"reason":"20字推荐原因","gaps":["需补能力"]}]
规则：score基于真实匹配度，不要全给高分。岗位名要具体，不要泛泛而写"产品经理"要写成"B端产品经理"等。`;

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
          // Accept single or batch
          const expList = data.experiences || (data.experience ? [data.experience] : []);
          for (const exp of expList) {
            session.experiences.push({
              id: session.experiences.length,
              company: exp.company, role: exp.role, duration: exp.duration, description: exp.description,
              followups: exp.followups || [], completed: true,
            });
          }
          if (data.finished) {
            session.stage = "PROJECTS";
            await saveSession(id, session);
            return NextResponse.json({
              stage: "PROJECTS",
              message: expList.length > 0 ? `已记录 ${session.experiences.length} 段经历。有项目经历要补充吗？` : "有项目经历要补充吗？比如课程设计、比赛项目、个人作品。",
            });
          }
          await saveSession(id, session);
          return NextResponse.json({ stage: "EXPERIENCE", ok: true });
        }
        case "PROJECTS": {
          const projList = data.projects || (data.project ? [data.project] : []);
          for (const p of projList) {
            session.projects.push({
              id: session.projects.length,
              name: p.name, background: p.background, role: p.role, tools: p.tools, results: p.results,
              followups: [], completed: true,
            });
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
          session.skills = {
            hardSkills: data.hardSkills || [],
            certificates: typeof data.certificates === "string" ? data.certificates.split(/[,，\s]+/).filter(Boolean) : (data.certificates || []),
            languages: typeof data.languages === "string" ? data.languages.split(/[,，\s]+/).filter(Boolean) : (data.languages || []),
          };
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
