import OpenAI from "openai";
import type { AnalysisResult } from "./types";

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

const LEARNING_PATH_GUIDE = `learningPath 中每条 resource 必须包含具体的学习渠道，格式：平台/渠道名 - 创作者/作者 - 课程/书名 - 一句话说明。例如：
"B站 - 王树义老师 -《产品经理从入门到精通》系列 - 覆盖需求分析和PRD撰写基础"
"慕课网 - Scott老师 -《React全栈开发实战》 - 适合前端入门，项目驱动"
"Coursera - Andrew Ng - Machine Learning - 机器学习经典入门课"
"微信读书 - 俞军 -《产品方法论》 - 理解产品经理的底层思考框架"
"微信公众号 - 人人都是产品经理 - 每日推送 - 跟进产品行业动态"
"极客时间 - 邱岳 -《产品经理实战课》 - 从0到1做产品的完整方法论"
请优先推荐中文资源和B站/慕课网/极客时间/掘金等国内可访问的渠道。`;

const SYSTEM_PROMPT = `你是资深求职顾问+HR，精通ATS筛选规则、简历优化和面试流程。

核心原则：
- 优先保证分析真实性，不编造经历和数据
- 根据简历中的工作年限自动调整评价标准（应届生/1-3年/3-5年/5年+）
- 根据目标岗位类型调整关注点（PM重需求分析，运营重增长转化，开发重技术栈，设计重作品）
- 重点检测ATS解析风险：日期格式（仅年份如"2022"、中文数字混用如"二〇二二"、缺少月份）、文件格式兼容性、特殊字符/表格/图片导致的关键信息丢失
${LEARNING_PATH_GUIDE}
你必须严格返回 JSON 格式，不要输出任何 JSON 之外的内容，不要用 markdown 代码块包裹。`;

function buildUserPrompt(resumeText: string, jdText: string, deep = false) {
  const isShortJD = jdText.length < 60;

  if (isShortJD) {
    return `请分析以下简历和岗位信息，返回结构化JSON分析结果。
注意：用户只提供了岗位名称/简短描述，请根据该岗位的行业通用要求进行分析。

=== 简历内容 ===
${resumeText}

=== 目标岗位 ===
${jdText}

返回的 JSON 结构如下（所有字段必填，根据岗位名称推断典型要求）：
{
  "matchScore": 数字0-100,
  "matchScoreBreakdown": { "skillsMatch": 数字, "experienceMatch": 数字, "educationMatch": 数字 },
  "resumeDigest": { "name": "姓名", "yearsOfExperience": 数字, "currentRole": "当前职位", "topSkills": ["技能"], "education": "学历" },
  "jdDigest": { "companyName": "未知", "roleTitle": "从输入中提取", "requiredSkills": ["请根据该岗位的行业通用要求推断"], "niceToHaveSkills": [], "experienceRequirement": "请推断", "educationRequirement": "请推断" },
  "atsRisks": [{ "severity": "high/medium/low", "category": "类别", "description": "问题描述", "suggestion": "改进建议" }],
  "missingSkills": [{ "skill": "技能名", "importance": "required/nice-to-have", "yourCurrentLevel": "无经验/了解/熟练" }],
  "resumeSuggestions": [{ "section": "简历段落", "issue": "问题", "improvedVersion": "优化后版本" }],
  "difficultyAnalysis": { "overallLevel": "入门/中等/困难/极难", "competitionLevel": "竞争程度", "salaryRange": "薪资范围", "interviewFocus": ["重点"], "keyBarriers": ["障碍"] },
  "learningPath": [{ "order": 数字, "skill": "技能", "resource": "学习资源", "timeEstimate": "时长", "priority": "immediate/short-term/long-term" }],
  "recommendedJobs": [{ "roleTitle": "推荐岗位名", "matchScore": 数字, "reason": "推荐理由一句话", "typicalSalary": "薪资范围", "difficulty": "入门/中等/困难", "learningPath": [{ "order": 1, "skill": "该岗位需补的核心技能", "resource": "平台 - 创作者 - 课程名 - 说明", "timeEstimate": "预计时间", "priority": "immediate/short-term/long-term" }] }]${deep ? `,
  "deepAnalysis": {
    "atsReport": { "score": 0-100, "missingKeywords": ["JD有但简历缺的关键词"], "tips": ["ATS优化建议"] },
    "hrReview": { "strengths": ["简历亮点"], "risks": ["面试可能追问的弱点"], "interviewFocus": ["面试官可能深挖的方向"], "impression": "HR看完简历的第一印象" },
    "coreAdvantage": "结合经历提炼的核心差异化优势",
    "personalizedAdvice": "针对这个岗位的个性化提升建议"
  }` : ""}
}`;
  }

  return `请分析以下简历和岗位JD，返回结构化JSON分析结果。

=== 简历内容 ===
${resumeText}

=== 岗位JD ===
${jdText}

返回的 JSON 结构如下（所有字段必填）：
{
  "matchScore": 数字0-100,
  "matchScoreBreakdown": { "skillsMatch": 数字, "experienceMatch": 数字, "educationMatch": 数字 },
  "resumeDigest": { "name": "姓名", "yearsOfExperience": 数字, "currentRole": "当前职位", "topSkills": ["技能"], "education": "学历" },
  "jdDigest": { "companyName": "公司名", "roleTitle": "职位名", "requiredSkills": [], "niceToHaveSkills": [], "experienceRequirement": "", "educationRequirement": "" },
  "atsRisks": [{ "severity": "high/medium/low", "category": "类别", "description": "问题描述", "suggestion": "改进建议" }],
  "missingSkills": [{ "skill": "技能名", "importance": "required/nice-to-have", "yourCurrentLevel": "无经验/了解/熟练" }],
  "resumeSuggestions": [{ "section": "简历段落", "issue": "问题", "improvedVersion": "优化后版本" }],
  "difficultyAnalysis": { "overallLevel": "入门/中等/困难/极难", "competitionLevel": "竞争程度", "salaryRange": "薪资范围", "interviewFocus": ["重点"], "keyBarriers": ["障碍"] },
  "learningPath": [{ "order": 数字, "skill": "技能", "resource": "学习资源", "timeEstimate": "时长", "priority": "immediate/short-term/long-term" }],
  "recommendedJobs": [{ "roleTitle": "推荐岗位名", "matchScore": 数字, "reason": "推荐理由一句话", "typicalSalary": "薪资范围", "difficulty": "入门/中等/困难", "learningPath": [{ "order": 1, "skill": "该岗位需补的核心技能", "resource": "平台 - 创作者 - 课程名 - 说明", "timeEstimate": "预计时间", "priority": "immediate/short-term/long-term" }] }]${deep ? `,
  "deepAnalysis": {
    "atsReport": { "score": 0-100, "missingKeywords": ["JD有但简历缺的关键词"], "tips": ["ATS优化建议"] },
    "hrReview": { "strengths": ["简历亮点"], "risks": ["面试可能追问的弱点"], "interviewFocus": ["面试官可能深挖的方向"], "impression": "HR看完简历的第一印象" },
    "coreAdvantage": "结合经历提炼的核心差异化优势",
    "personalizedAdvice": "针对这个岗位的个性化提升建议"
  }` : ""}
}`;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in response");
  return text.slice(firstBrace, lastBrace + 1);
}

export async function analyzeResume(
  resumeText: string,
  jdText: string,
  deep = false
): Promise<AnalysisResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(resumeText, jdText, deep) },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });

      const text = response.choices[0]?.message?.content || "";
      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);

      if (
        typeof parsed.matchScore !== "number" ||
        !Array.isArray(parsed.atsRisks) ||
        !Array.isArray(parsed.missingSkills) ||
        !Array.isArray(parsed.resumeSuggestions) ||
        !parsed.difficultyAnalysis ||
        !Array.isArray(parsed.learningPath)
      ) {
        throw new Error("Response missing required fields");
      }

      return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        resumeDigest: parsed.resumeDigest,
        jdDigest: parsed.jdDigest,
        matchScore: parsed.matchScore,
        matchScoreBreakdown: parsed.matchScoreBreakdown,
        atsRisks: parsed.atsRisks,
        missingSkills: parsed.missingSkills,
        resumeSuggestions: parsed.resumeSuggestions,
        difficultyAnalysis: parsed.difficultyAnalysis,
        learningPath: parsed.learningPath,
        recommendedJobs: Array.isArray(parsed.recommendedJobs)
          ? parsed.recommendedJobs
          : [],
        ...(deep && parsed.deepAnalysis ? { deepAnalysis: parsed.deepAnalysis } as any : {}),
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt === 0) continue;
    }
  }

  throw new Error(`AI analysis failed: ${lastError?.message}`);
}
