// Interview question bank by job category — curated, verified questions
// Used as reference in AI interview generation for consistency

export interface BankQuestion {
  type: "hr" | "professional";
  question: string;
  whatToLookFor: string; // evaluation criteria for scoring
}

export const questionBank: Record<string, BankQuestion[]> = {
  // ─── 通用 HR ───
  hr: [
    { type: "hr", question: "请做一个简短的自我介绍，重点突出与目标岗位相关的经验和能力。", whatToLookFor: "结构清晰（30-60秒），突出与岗位匹配的经历，有数据或成果支撑" },
    { type: "hr", question: "你为什么离开上一家公司？/为什么想来我们公司？", whatToLookFor: "积极正面的动机，避免抱怨前公司，对目标公司有了解" },
    { type: "hr", question: "你未来3-5年的职业规划是什么？", whatToLookFor: "目标清晰可执行，与应聘公司发展方向有交集" },
    { type: "hr", question: "请描述一次你遇到的最大的工作挑战，以及你是如何解决的。", whatToLookFor: "STAR法则完整，有具体数据，体现解决问题的能力" },
    { type: "hr", question: "你如何看待加班？如何平衡工作和生活？", whatToLookFor: "态度真诚，不讨好也不抵触，体现时间管理能力" },
    { type: "hr", question: "你的期望薪资是多少？你的底线是什么？", whatToLookFor: "有市场调研依据，给出合理范围，能说明自己的价值" },
    { type: "hr", question: "你最近学习了什么新技能或知识？", whatToLookFor: "持续学习的习惯，与工作相关，有行动证据" },
    { type: "hr", question: "如果入职后发现这个岗位和想象的不一样，你会怎么做？", whatToLookFor: "理性务实，主动沟通和适应，不极端反应" },
  ],

  // ─── 产品经理 ───
  "互联网-产品": [
    { type: "professional", question: "你最满意的一个产品项目是什么？请详细说说你在这个项目中的角色和贡献。", whatToLookFor: "完整的从需求到上线的经历，有决策逻辑和数据结果" },
    { type: "professional", question: "你如何确定产品需求的优先级？请举个具体例子。", whatToLookFor: "有优先级框架（RICE/Kano/价值-成本），能量化决策过程" },
    { type: "professional", question: "如何衡量一个产品的成功？你关注哪些核心指标？", whatToLookFor: "北极星指标+拆解逻辑，区分虚荣指标和核心指标" },
    { type: "professional", question: "你如何做竞品分析？最近做过的一次竞品分析是关于什么的？", whatToLookFor: "有系统性方法，不只罗列功能，关注战略和差异化" },
    { type: "professional", question: "当研发说某个需求做不了时，你怎么处理？", whatToLookFor: "沟通和换位思考能力，寻找替代方案而非硬推" },
    { type: "professional", question: "你如何与设计师/运营/销售等不同角色协作？", whatToLookFor: "理解不同角色的目标和语言，有具体协作案例" },
    { type: "professional", question: "说一个你做的产品决策后来被证明是错的。你从中学到了什么？", whatToLookFor: "坦诚承认错误，有复盘和反思，有具体的改进措施" },
  ],

  // ─── 软件开发 ───
  "互联网-后端/架构": [
    { type: "professional", question: "请描述你参与过的最复杂的系统或架构，你在其中的角色是什么？", whatToLookFor: "清楚描述系统设计和技术选型的理由，有量化的性能指标" },
    { type: "professional", question: "你如何保证代码质量？团队用什么流程进行代码审查和测试？", whatToLookFor: "有Code Review、单元测试和CI/CD实践，不只是说" },
    { type: "professional", question: "你遇到过的最棘手的线上故障是什么？如何排查和修复的？", whatToLookFor: "排查有系统性方法，有应急预案，事后有复盘和改进" },
    { type: "professional", question: "你如何评估一个新技术的引入？最近一次引入新技术是什么？", whatToLookFor: "权衡技术收益和成本，不是追新，关注稳定性和团队能力" },
    { type: "professional", question: "如果让你设计一个高并发系统，你会从哪些方面考虑？", whatToLookFor: "系统性的高可用架构思维（缓存、削峰、限流、降级、分布式）" },
  ],

  // ─── 前端开发 ───
  "互联网-前端/客户端": [
    { type: "professional", question: "你最熟悉的前端框架是什么？做过的最复杂的组件是什么？", whatToLookFor: "深入理解框架原理而非只会用，组件设计有复用性和可维护性考量" },
    { type: "professional", question: "如何做前端性能优化？请举个你实际优化过的例子。", whatToLookFor: "有具体的优化手段和数据对比（首屏加载、打包体积、渲染性能）" },
    { type: "professional", question: "你如何看待TypeScript？在一个项目中你是如何推动TypeScript落地的？", whatToLookFor: "理解类型系统的价值，有实际的推动经验和收益说明" },
  ],

  // ─── UI/UX 设计 ───
  "互联网-设计": [
    { type: "professional", question: "请展示你最满意的一个设计作品，并说说你的设计过程和决策。", whatToLookFor: "有完整的设计流程（调研→草图→原型→测试），有用户反馈数据" },
    { type: "professional", question: "你如何平衡用户体验和业务目标？举个具体例子。", whatToLookFor: "不是零和思维，能找到双赢方案，能量化设计对业务的影响" },
    { type: "professional", question: "你如何做用户研究？最近一次用户研究发现了什么？", whatToLookFor: "有具体的调研方法（访谈/问卷/可用性测试），洞察能驱动设计决策" },
  ],

  // ─── 运营 ───
  "电商-平台运营": [
    { type: "professional", question: "你策划过的最成功的运营活动是什么？带来了什么效果？", whatToLookFor: "完整的策划→执行→复盘过程，有量化的增长数据" },
    { type: "professional", question: "你如何确定一个运营活动的目标？怎么衡量ROI？", whatToLookFor: "目标设定基于数据而非拍脑袋，有投入产出计算" },
    { type: "professional", question: "如何做用户分层运营？你实际用过什么分层方法？", whatToLookFor: "有RFM/生命周期等分层逻辑，有对应的差异化策略" },
  ],

  // ─── 销售/商务 ───
  "企业服务-销售/商务": [
    { type: "professional", question: "你完成过的最大的一个订单是怎样的？从开发到成交用了多久？", whatToLookFor: "完整的销售流程，有策略性和关系管理，有量化的成交额" },
    { type: "professional", question: "你如何开发新客户？你用什么渠道和方法？", whatToLookFor: "有系统性的获客方式，了解不同渠道的投入产出" },
    { type: "professional", question: "当客户对你的报价提出异议时，你怎么处理？", whatToLookFor: "不是直接降价，能挖掘客户真实需求和痛点，体现价值" },
  ],

  // ─── 财务/会计 ───
  "企业服务-财务/审计": [
    { type: "professional", question: "你熟悉哪些财务软件和ERP系统？在日常工作中如何使用？", whatToLookFor: "熟练使用主流财务工具，了解财务核算和报表流程" },
    { type: "professional", question: "你在之前的公司做过哪些税务筹划工作？效果如何？", whatToLookFor: "了解税收政策，有具体的筹划方案和量化结果" },
  ],

  // ─── HR/人事 ───
  "企业服务-人事": [
    { type: "professional", question: "你负责过的最有挑战的招聘case是什么？怎么解决的？", whatToLookFor: "有具体的招聘策略和渠道选择，有实际招聘数据" },
    { type: "professional", question: "你如何处理员工关系问题？举个实际例子。", whatToLookFor: "既维护公司利益也关心员工，有沟通技巧和法律意识" },
    { type: "professional", question: "你如何设计绩效考核方案？关注哪些指标？", whatToLookFor: "绩效与业务目标对齐，不是形式化，关注激励和发展" },
  ],

  // ─── 教师/教育 ───
  "教育-学校/K12": [
    { type: "professional", question: "请说说你的教学理念和方法。你是如何让一个难懂的概念变得容易理解的？", whatToLookFor: "有具体的教学策略和案例，关注学生理解而非照本宣科" },
    { type: "professional", question: "你如何处理课堂上的纪律问题或学生冲突？", whatToLookFor: "管理有方法，有同理心，能平衡秩序和关爱" },
  ],

  // ─── 医护 ───
  "医疗-临床/护理": [
    { type: "professional", question: "你遇到过的最紧急的医疗情况是什么？你当时是怎么处理的？", whatToLookFor: "冷静专业，按规范操作，有团队协作意识" },
    { type: "professional", question: "如何处理与患者或家属的沟通困难？举个例子。", whatToLookFor: "有同理心和沟通技巧，能在专业范围内安抚和解释" },
  ],

  // ─── 行政/文员 ───
  "企业服务-行政/客服": [
    { type: "professional", question: "你同时面对多个紧急任务时怎么安排优先级？", whatToLookFor: "有系统性的优先级判断，不是谁催得急就做谁" },
    { type: "professional", question: "你如何优化过公司的行政流程？带来了什么改善？", whatToLookFor: "主动发现问题并改进，有具体的优化措施和效果" },
  ],

  // ─── 客服 ───
  "企业服务-销售/商务": [
    { type: "professional", question: "你处理过的最难缠的客户投诉是什么？结果如何？", whatToLookFor: "情绪稳定，有同理心，能解决问题而不仅安抚" },
    { type: "professional", question: "你如何控制自己的情绪，在处理大量客户问题后保持服务质量？", whatToLookFor: "有自我调节能力，有具体方法" },
  ],
};

// Get questions for a specific job category
export function getQuestionsForCategory(category: string): BankQuestion[] {
  // Exact match first
  if (questionBank[category]) return questionBank[category];

  // Prefix match (e.g. "互联网-产品" matches "互联网-产品")
  for (const key of Object.keys(questionBank)) {
    if (key !== "hr" && category.startsWith(key.split("-")[0])) {
      return questionBank[key];
    }
  }

  // Fallback: HR only
  return questionBank.hr || [];
}

// Get HR questions + category-specific professional questions
export function getInterviewQuestions(category: string, count: number): BankQuestion[] {
  const hr = questionBank.hr || [];
  const professional = getQuestionsForCategory(category);
  const all = [...hr, ...professional];

  // Shuffle and pick 'count'
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
