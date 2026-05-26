import OpenAI from "openai";
import type { RewriteResult } from "./types";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
  return _client;
}

// ─── System Prompt — Enhancement, not Regeneration ─────────────

const SYSTEM_PROMPT = `你是资深互联网大厂AI产品经理面试官。你的任务是**增强**用户的简历，而不是重写一份新简历。

## 核心原则：保留用户简历身份

1. **保留结构** — 用户原有的section顺序、section标题、内容组织方式必须保留。modules 输出顺序必须和用户简历从上到下一致
2. **增强表达** — 仅优化每条描述的措辞、结构和专业度
3. **不增删内容** — 不新增用户没有的经历，不删除用户已有的经历
4. **不调整顺序** — modules 数组的第一个元素对应简历最上方的内容，最后一个对应简历最下方

## 增强维度（每条描述优化时应用）

1. **STAR结构** — 将弱化描述重组为 情境→任务→行动→结果
2. **数据化** — 补充可量化指标（有原文依据可推断，不虚构具体金额）
3. **ATS关键词** — 嵌入JD中的高权重技能词和行业词
4. **AI PM术语** — 产品方法论(PMF/北极星指标/AHA时刻/用户心智)、增长词(DAU/LTV/CAC/留存)、数据词(漏斗/归因/Cohort)、AI词(推荐算法/NLP/召回/准确率/A/B实验)
5. **专业化** — 删除"负责""参与""协助"等弱化词，用"主导""设计""推动""Owner"

## 输出格式

返回JSON，包含两个核心字段：

1. **modules** — 增强记录（用于UI Before/After展示）
2. **finalResume** — 完整结构化的最终简历（用于PDF渲染，Preview和Export共用）

{
  "summary": "一句话总结优化效果",
  "atsImprovement": 数字,
  "matchScoreImprovement": 数字,
  "aiPmMatchEnhancement": "AI PM专业表达增强说明",
  "modules": [
    {
      "sourceSection": "Work Experience·腾讯·产品负责人",
      "sectionTitle": "增强后的显示标题",
      "original": "简历原文",
      "rewritten": "增强后版本(≤100字符)",
      "optimizationReasons": ["优化点1", "优化点2", "优化点3"],
      "category": "star | data | ats | keyword | growth | professional",
      "scoreImprovement": { "ats": 0-10, "professionalism": 0-10, "dataDriven": 0-10 }
    }
  ],
  "finalResume": {
    "header": { "name": "姓名", "role": "职位头衔如 AI产品经理", "contact": "电话 · 邮箱 · 城市" },
    "summary": "增强后的完整自我介绍，≤120字符",
    "sections": [
      {
        "label": "工作经历",
        "entries": [
          { "title": "公司名 · 职位", "subtitle": "时间范围", "bullets": ["增强后bullet1", "增强后bullet2", "增强后bullet3"] }
        ]
      },
      {
        "label": "项目经历",
        "entries": [
          { "title": "项目名称", "subtitle": "角色/成果概述", "bullets": ["增强后bullet1", "增强后bullet2"] }
        ]
      }
    ],
    "skills": ["技能1", "技能2", "技能3"],
    "education": { "school": "学校名", "degree": "学位", "year": "年份" }
  }
}

**重要**：
- finalResume 是PDF的唯一数据源，Preview和Export共用
- sections 的 label 只用中文：工作经历、项目经历
- header.name 从简历提取真实姓名，不要填占位符
- 每个 bullet 必须使用增强后的版本

## 长度约束
- 每个rewritten字段≤100中文字符
- 每个sourceSection对应的bullets≤3条
- summary≤120字符
- 目标：1页简历可容纳全部内容

## 严禁
- 虚构用户没有的经历或数据
- 重组用户简历结构
- 删除用户原有内容
- 使用"赋能""抓手""闭环""打法"等互联网黑话
- 堆砌AI词汇而内容空洞
- 输出非JSON内容`;

// ─── User Prompt ────────────────────────────────────────────────

function buildRewritePrompt(resumeText: string, jdText: string) {
  return `请增强以下简历，使其更符合目标岗位要求。

**重要**：保留用户原有简历结构，仅增强每条内容的表达质量和专业度。

=== 用户简历 ===
${resumeText}

=== 目标岗位JD ===
${jdText}

请逐条增强简历中的每个point，输出6-12条增强记录。

**严格按用户简历从上到下的顺序**输出modules——即resume最上面的内容先输出，最下面的内容后输出。这个顺序很重要，PDF会直接使用这个顺序渲染。

优先增强：
1. Work Experience 和 Project Experience 描述
2. Self Introduction
3. Skills（增强为"技能→应用场景→产出"的表达）
4. 任何缺少数据的描述

每条增强的sourceSection必须明确指出该内容的原始位置。`;
}

// ─── JSON Extractor ─────────────────────────────────────────────

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1)
    throw new Error("No JSON found in response");
  return text.slice(firstBrace, lastBrace + 1);
}

// ─── Main Export ────────────────────────────────────────────────

export async function rewriteResume(
  resumeText: string,
  jdText: string
): Promise<RewriteResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildRewritePrompt(resumeText, jdText) },
        ],
        temperature: 0.35,
        max_tokens: 12000,
      });

      const text = response.choices[0]?.message?.content || "";
      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);

      if (
        !parsed.summary ||
        !Array.isArray(parsed.modules) ||
        parsed.modules.length === 0
      ) {
        throw new Error("Response missing required fields");
      }

      for (const m of parsed.modules) {
        if (
          !m.sourceSection ||
          !m.sectionTitle ||
          !m.original ||
          !m.rewritten ||
          !Array.isArray(m.optimizationReasons) ||
          m.optimizationReasons.length === 0
        ) {
          throw new Error(`Module missing required fields`);
        }
      }

      // Build backward-compatible sections
      const sections = parsed.modules.map((m: Record<string, unknown>) => ({
        sectionTitle: String(m.sectionTitle),
        original: String(m.original),
        rewritten: String(m.rewritten),
        reason:
          Array.isArray(m.optimizationReasons) && m.optimizationReasons.length > 0
            ? String(m.optimizationReasons[0])
            : "",
        category: String(m.category || "professional"),
      }));

      // Parse finalResume — the single source of truth for PDF rendering
      if (!parsed.finalResume || !parsed.finalResume.header) {
        throw new Error("AI 未返回完整简历数据 (finalResume 缺失)，请重试");
      }
      const finalResume = parsed.finalResume;

      return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        summary: parsed.summary,
        atsImprovement: typeof parsed.atsImprovement === "number" ? parsed.atsImprovement : 0,
        matchScoreImprovement:
          typeof parsed.matchScoreImprovement === "number"
            ? parsed.matchScoreImprovement
            : 0,
        aiPmMatchEnhancement: parsed.aiPmMatchEnhancement || "",
        resumeDigest: { name: "", yearsOfExperience: 0, currentRole: "", topSkills: [], education: "" },
        jdDigest: { companyName: "", roleTitle: "", requiredSkills: [], niceToHaveSkills: [], experienceRequirement: "", educationRequirement: "" },
        sections,
        modules: parsed.modules,
        finalResume,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt === 0) continue;
    }
  }

  throw new Error(`AI rewrite failed: ${lastError?.message}`);
}
