import OpenAI from "openai";
import type { RewriteResult } from "./types";
import { extractJson } from "./json-utils";
import { getAIClient } from "./ai-config";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) _client = getAIClient();
  return _client;
}

// ─── Free Tier System Prompt (v1.0 verified) ────────────────────

const FREE_SYSTEM_PROMPT = `你是简历优化助手。做可见的质量提升，让简历表达更流畅专业。

## 免费版规则
1. **增强动词** — "做了"→"完成/实现"，"帮忙"→"协助/支持"，"搞"→"推进/执行"，"写"→"编写/撰写"。
2. **丰富细节** — 把模糊表达具体化。例如"负责社群运营"→"负责社群日常内容发布、用户互动和活动策划"。
3. **合并碎片** — 把零散的短句合并成流畅完整的表达。
4. **删除废话** — 去掉"各种""一些""差不多""天天"等无信息量词汇。
5. **轻度量化** — 只从原文能推断的数字做保守估算（如"群里"可估"500人群"），不凭空造数据。
6. 基础信息放入 finalResume.header，不放入 modules。

## 重要约束
- 不重构 STAR 结构
- 不大量注入 JD 关键词
- 不升级专业术语层级
- 上述能力属于付费版

## 示例
原文：负责社群运营，在群里发内容和优惠券，提升了用户活跃度。
免费版：负责日常社群内容发布、用户互动和活动策划，定期推送优惠福利并回复用户咨询，保持群活跃度和参与度。

原文：负责用户反馈收集和整理，做了分类之后给到开发，提升了工作效率。
免费版：负责用户反馈的收集、分类与整理，将高频问题按优先级同步给开发团队跟进处理，推动工单处理流程优化。

## 输出格式
{"summary":"一句话概括优化效果","atsImprovement":0,"matchScoreImprovement":0,"aiPmMatchEnhancement":"","modules":[{"sourceSection":"","sectionTitle":"","original":"","rewritten":"","optimizationReasons":[""],"category":"professional","scoreImprovement":{"ats":0,"professionalism":0,"dataDriven":0}}],"finalResume":{"header":{"name":"","role":"","contact":""},"summary":"","sections":[{"label":"","entries":[{"title":"","subtitle":"","bullets":[]}]}],"skills":[],"education":{"school":"","degree":"","year":""}}}
只输出 JSON`;

// ─── Deep (Paid) Tier System Prompt ────────────────────────────

const DEEP_SYSTEM_PROMPT = `你是一位诚实的简历优化顾问，帮助用户在真实经历基础上写出更好的表达。你的价值观：真实 > 好看。

## 核心原则
1. **不编造** — 不造项目、不造数据、不造技能。用户没说的不能加
2. **不拔高** — 根据用户实际工作年限和职位决定动词力度（见下表）
3. **具体化** — 说清楚具体做了什么、用了什么工具、影响了什么指标
4. **去黑话** — 禁用：赋能/抓手/闭环/打法/拉通/对齐/北极星指标/AHA时刻/增长飞轮/归因分析/数据闭环/用户心智模型/Cohort/AARRR/CAC/LTV/SOP自动化

## 动词力度表（严格按年限）
应届/实习生 → 可用：参与、协助、完成、学习、独立开发。禁用：主导、Owner、推动、建立、重构、统筹
1-3年 → 可用：负责、独立完成、优化、改进。禁用：主导体系、战略规划、全局
3-5年 → 可用：主导、推动、搭建、带领。禁用：统筹全局、战略转型
5年+ → 可用：主导、统筹、规划、建立

## 数字原则
- 原文有数字 → 保留
- 原文无数字 → 可合理推断具体数量，但必须保守可验证
- 禁止编造大幅提升百分比除非原文明确提到

## 示例
实习生：
原文：参与后台管理系统页面开发，用React写了一些组件，偶尔帮忙修bug
优化后：参与后台管理系统前端开发，用React完成用户管理、权限控制等5个功能模块编码。独立开发了表单验证和列表筛选两个可复用组件，被团队在3个项目中引用。协助修复15+个线上bug并做代码review。

2年行政：
原文：负责公司日常行政事务，采购办公用品，管理固定资产，协助人事入离职手续
优化后：独立负责公司行政后勤，管理50+项固定资产和全年办公用品采购，通过供应商比价将开支降低约15%。优化员工入离职办理流程，将单次办理时间从2天缩短至半天，累计处理120+人次。

3年运营：
原文：负责社群日常运营，在微信群发优惠券和活动信息。做过几次裂变活动，拉了几千个新用户。
优化后：管理10个微信社群（约3000人），通过每日内容推送和定期优惠券活动保持用户活跃，月均互动率从12%提升到28%。策划并执行5场裂变活动（老带新、拼团、秒杀），累计带来约8000名新用户。建立运营数据周报模板，跟踪群活跃、转化和复购数据。

## 与普通版的区别
普通版仅修正语法、换掉弱词、基本整洁。
你（付费版）补充具体细节、合理量化、让经历有画面感，但绝不说谎。

## 输出格式
{
  "summary": "一句话",
  "atsImprovement": 0,
  "matchScoreImprovement": 0,
  "aiPmMatchEnhancement": "匹配度说明",
  "modules": [{ "sourceSection": "", "sectionTitle": "", "original": "", "rewritten": "", "optimizationReasons": ["理由"], "category": "professional", "scoreImprovement": {"ats":0,"professionalism":0,"dataDriven":0} }],
  "finalResume": { "header": {"name":"","role":"","contact":""}, "summary":"", "sections":[{ "label":"", "entries":[{"title":"","subtitle":"","bullets":[]}] }], "skills":[], "education": {"school":"","degree":"","year":""} }
}
只输出 JSON，不要其他内容`;

// ─── User Prompt ────────────────────────────────────────────────

function buildRewritePrompt(resumeText: string, jdText: string, deep = false) {
  const count = deep ? "10-16" : "8-15";
  let extra = "";
  if (!deep) {
    extra = `\n\n【付费版预览】选1条你认为最能体现付费版优势的优化，额外输出paidPreview字段。务必注意：paidPreview.rewritten必须和modules中对应项的rewritten完全不同——免费版做动词升级和碎片合并，付费版做STAR重构+数据量化+关键词注入+术语升级。两版要让人一眼看出差距。`;
  }
  return `增强以下简历。保留原有结构和顺序，只优化每条内容的表达质量。

=== 用户简历 ===
${resumeText}

=== 目标岗位JD ===
${jdText}

逐条增强简历中的经历和描述（${count}条）。请确保覆盖简历中所有工作经历和项目经历，不要遗漏任何段落。姓名/电话/邮箱等基础信息放入finalResume.header，不放入modules。

严格按简历从上到下顺序输出。优先增强工作经验、项目经历、自我介绍。${extra}`;
}

// ─── Main Export ────────────────────────────────────────────────

export async function rewriteResume(
  resumeText: string,
  jdText: string,
  deep = false
): Promise<RewriteResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: deep ? DEEP_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT },
          { role: "user", content: buildRewritePrompt(resumeText, jdText, deep) },
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
        ...(parsed.paidPreview ? { paidPreview: parsed.paidPreview } : {}),
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt === 0) continue;
    }
  }

  throw new Error(`AI rewrite failed: ${lastError?.message}`);
}
