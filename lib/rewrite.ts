import OpenAI from "openai";
import type { RewriteResult } from "./types";

const client = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const REWRITE_SYSTEM_PROMPT = `你是资深互联网大厂产品经理面试官，精通简历优化和ATS筛选。
你的任务是逐段改写用户简历，使其更符合目标岗位JD的要求。

改写原则：
1. STAR法则：情境(Situation)→任务(Task)→行动(Action)→结果(Result)
2. 每个要点必须有可量化数据（百分比、金额、用户数、留存率等）
3. 嵌入岗位JD中的关键词，提高ATS匹配
4. 使用产品经理专业术语（用户旅程、AHA时刻、北极星指标、用户心智、PMF、LTV、CAC等）
5. 突出增长方向/数据分析/项目成果表达
6. 删除"负责""参与""协助"等弱化描述和无意义副词
7. 每条改写后内容必须比原文有明显冲击力提升

你必须严格返回 JSON 格式，不要输出任何 JSON 之外的内容，不要用 markdown 代码块包裹。`;

function buildRewritePrompt(
  resumeText: string,
  jdText: string
) {
  return `请逐段改写以下简历，使其更符合目标岗位JD。

=== 简历内容 ===
${resumeText}

=== 目标岗位JD ===
${jdText}

对简历中每条可优化的经历/描述，生成一条改写记录。每条必须包含：
- sectionTitle: 模块名（如"项目经历·XX项目"）
- original: 修改前原文
- rewritten: 修改后版本（STAR结构 + 量化数据 + JD关键词）
- reason: 修改原因（1-2句，说明改了什么维度）
- category: 优化维度，可选值：star（STAR结构）、data（数据化）、ats（ATS关键词）、keyword（PM专业术语）、growth（增长表达）、professional（专业化）

返回 JSON：
{
  "summary": "顶部总结语，一句话说明优化效果",
  "sections": [
    {
      "sectionTitle": "项目经历·智能客服系统优化",
      "original": "负责用户反馈收集和优化",
      "rewritten": "主导智能客服系统V3迭代，通过用户行为漏斗分析定位关键流失节点，优化意图识别模型训练数据标注流程，将准确率从72%提升至89%，月均减少人工客服成本12万元",
      "reason": "STAR结构完整（迭代→分析→优化→结果）；嵌入AI/数据关键词；量化业务影响",
      "category": "star"
    }
  ]
}

请输出 5-8 条改写记录，覆盖不同的优化维度。`;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1)
    throw new Error("No JSON found in response");
  return text.slice(firstBrace, lastBrace + 1);
}

export async function rewriteResume(
  resumeText: string,
  jdText: string
): Promise<RewriteResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: REWRITE_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildRewritePrompt(resumeText, jdText),
          },
        ],
        temperature: 0.4,
        max_tokens: 8000,
      });

      const text = response.choices[0]?.message?.content || "";
      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);

      if (
        !parsed.summary ||
        !Array.isArray(parsed.sections) ||
        parsed.sections.length === 0
      ) {
        throw new Error("Response missing required fields");
      }

      return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        summary: parsed.summary,
        resumeDigest: { name: "", yearsOfExperience: 0, currentRole: "", topSkills: [], education: "" },
        jdDigest: { companyName: "", roleTitle: "", requiredSkills: [], niceToHaveSkills: [], experienceRequirement: "", educationRequirement: "" },
        sections: parsed.sections,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt === 0) continue;
    }
  }

  throw new Error(`AI rewrite failed: ${lastError?.message}`);
}
