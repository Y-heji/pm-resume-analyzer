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

// ─── System Prompt — Quality-first Rewrite ─────────────────────

const SYSTEM_PROMPT = `你是字节跳动/腾讯的资深AI产品经理面试官，精通简历筛选和ATS规则。
你的任务是逐条增强用户简历——保留结构，只优化表达质量和专业度。

## 改写七原则（每条必须应用）

1. **STAR结构** — 每条经历重组为：情境→任务→行动→结果。只写1-2句，每个词都要有力。

2. **量化数据** — 每条必须有可量化指标（百分比/用户数/留存率/效率提升）。
   原文无数据时，合理推断标注"约""近""超"，但绝不虚构具体金额。

3. **ATS关键词注入** — 从JD中提取高权重技能词和行业词，自然嵌入改写内容。
   例如JD写"推荐算法"，改写中就出现"协同过滤""召回策略""排序模型"。

4. **AI PM专业术语** — 主动使用：PMF、北极星指标、AHA时刻、用户心智、增长飞轮、
   LTV、CAC、留存漏斗、DAU/MAU、归因分析、Cohort、A/B实验平台、特征工程、数据闭环。

5. **删除弱化词** — "负责""参与""协助"→"主导""设计并推动""Owner"。
   "完成了""做了"→"达成""驱动""实现"。每个动词都要有力量。

6. **结果导向** — 每条的落脚点是业务结果：提升了X%留存、降低Y%流失、带来Z万DAU。
   不写"做了什么事"，写"通过做什么事，达成了什么结果"。

7. **专业化表达** — 不用口语，不用长句，不用"赋能""抓手""闭环""打法"等互联网黑话。
   每条改写后必须比原文有明显冲击力提升。

## 信息分类（关键）

用户简历中提取到的**姓名、电话、邮箱、城市、年龄、性别**等基础信息 →
放入 finalResume.header，**不要**出现在 modules 数组中。

modules 只包含**可以被STAR增强的经历描述**：工作经验、项目经历、自我介绍、技能描述。

## 改写示例

简历原文：
"负责用户反馈系统优化，提升了客服效率"

改写后：
"主导智能客服V3迭代——分析10万+用户会话数据定位Top3流失节点，
重构意图识别模型标注流程，将AI自动解决率从62%提升至81%，
月均减少人工客服成本约12万元"

改写分析：STAR完整（迭代→分析→重构→结果）；嵌入了AI/数据关键词；
3个量化指标；删除了"负责"改为"主导"；结果落脚在成本和效率提升。

## 输出格式

返回JSON（两个字段都必填）：

{
  "summary": "一句话总结优化效果",
  "atsImprovement": 数字,
  "matchScoreImprovement": 数字,
  "aiPmMatchEnhancement": "AI PM专业表达增强说明",
  "modules": [
    {
      "sourceSection": "Work Experience·公司名·职位名",
      "sectionTitle": "增强后的显示标题",
      "original": "简历原文截取",
      "rewritten": "增强后版本——完整STAR，量化数据，专业表达",
      "optimizationReasons": ["增强数据表达", "嵌入JD关键词", "STAR结构重组"],
      "category": "star | data | ats | keyword | growth | professional",
      "scoreImprovement": { "ats": 0-10, "professionalism": 0-10, "dataDriven": 0-10 }
    }
  ],
  "finalResume": {
    "header": { "name": "姓名", "role": "职位头衔", "contact": "电话 · 邮箱 · 城市" },
    "summary": "增强后的自我介绍",
    "sections": [
      {
        "label": "工作经历",
        "entries": [
          { "title": "公司名 · 职位", "subtitle": "时间", "bullets": ["增强后bullet1", "bullet2"] }
        ]
      },
      {
        "label": "项目经历",
        "entries": [
          { "title": "项目名", "subtitle": "角色/成果", "bullets": ["增强后bullet1", "bullet2"] }
        ]
      }
    ],
    "skills": ["技能1", "技能2", "技能3"],
    "education": { "school": "学校", "degree": "学位", "year": "年份" }
  }
}

## 注意事项
- modules 按简历从上到下顺序输出
- 每个 rewritten 精炼但完整——好的STAR需要约60-120字符，不设硬限制，以质量为准
- 每条 optimizationReasons 列出3个具体维度
- finalResume 是 PDF 唯一数据源
- 只输出 JSON，不输出其他内容`;

// ─── User Prompt ────────────────────────────────────────────────

function buildRewritePrompt(resumeText: string, jdText: string) {
  return `增强以下简历。保留原有结构和顺序，只优化每条内容的表达质量。

=== 用户简历 ===
${resumeText}

=== 目标岗位JD ===
${jdText}

逐条增强简历中的经历和描述（8-15条）。姓名/电话/邮箱等基础信息放入finalResume.header，不放入modules。

严格按简历从上到下顺序输出。优先增强工作经验、项目经历、自我介绍。`;
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
        temperature: 0.4,
        max_tokens: 16000,
      });

      const text = response.choices[0]?.message?.content || "";
      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);

      if (
        !parsed.summary ||
        !Array.isArray(parsed.modules) ||
        parsed.modules.length === 0
      ) {
        throw new Error("Response missing required fields (summary, modules)");
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
          throw new Error("Module missing required fields");
        }
      }

      if (!parsed.finalResume || !parsed.finalResume.header) {
        throw new Error("AI 未返回完整简历数据 (finalResume 缺失)，请重试");
      }

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
        finalResume: parsed.finalResume,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt === 0) continue;
    }
  }

  throw new Error(`AI rewrite failed: ${lastError?.message}`);
}
