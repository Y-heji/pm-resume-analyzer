# AI 模拟面试 — 设计文档

> **目标**：将 PM Resume Analyzer 从"简历优化工具"升级为"求职全流程辅助平台"

## 一、功能定位

付费功能。用户完成简历分析/改写后，进入模拟面试。

面试内容根据用户简历 + 目标岗位 + 工作年限 + 技能标签动态生成，禁止固定题库。

## 二、免费版 vs 付费版

| | 免费版 | 付费版（deep） |
|------|------|------|
| 模式 | 基础 HR 面试 | HR + 专业深度面试 |
| 题数 | 5 题 | 8-12 题 |
| 追问 | 每题最多 1 次追问 | 每题无限追问 |
| 评分 | 基础评分 + 建议 | 5 维度评分 + 扣分原因 |
| 报告 | 总分 + 优劣 + 建议 | 完整报告（8 模块） |
| 历史 | 不存 | JSON 文件持久化 |

## 三、入口

改写结果页（`/rewrite/[id]`）底部新增「模拟面试」按钮。
- 免费版：点击进入基础面试
- 付费版（deep=1）：点击进入深度面试

## 四、API 设计

**端点**：`POST /api/interview`

| action | 输入 | 输出 | 说明 |
|------|------|------|------|
| start | `{ resumeText, jdText, deep }` | 面试方案 + 第1题 | 初始化 |
| answer | `{ sessionId, answer }` | 追问/下一题 | 提交回答 |
| end | `{ sessionId }` | 完整报告 | 结束面试 |

## 五、数据结构

```typescript
interface InterviewSession {
  id: string;
  resumeText: string;
  jdText: string;
  tier: "free" | "paid";
  plan: { difficulty; duration; questionCount; focusAreas[] };
  questions: InterviewQuestion[];
  currentStep: number;
  status: "active" | "completed";
  createdAt: string;
}

interface InterviewQuestion {
  id: number;
  type: "hr" | "professional";
  question: string;
  answer: string;
  followUps: { question: string; answer: string }[];
  score?: { professionalism; expression; logic; structure; match; total; deductionReason };
}
```

付费版会话存为 `data/interviews/{sessionId}.json`。

## 六、Prompt 架构（三层）

**1. 开场**（start）— 生成面试方案 + 第1题
**2. 追问/下一题**（answer）— 判断追问还是下一题还是结束
**3. 评分+报告**（end）— 付费版5维度评，免费版基础评

## 七、前端交互

- 路径：`/interview/[id]`
- Chat 风格对话流
- 底部输入框 + Enter 发送
- 四种状态：loading / active / report / error
- 报告页：评分 + 优劣势 + 建议

## 八、文件清单

| 文件 | 说明 |
|------|------|
| `app/interview/[id]/page.tsx` | 面试界面 |
| `app/api/interview/route.ts` | 面试 API |
| `lib/interview.ts` | 面试引擎（prompt + 状态管理） |
| `app/rewrite/[id]/page.tsx` | 加「模拟面试」入口按钮 |
| `data/interviews/` | 面试历史存储目录 |

## 九、MVP 不做的

- 语音输入
- 雷达图可视化（后续加 ECharts）
- 历史记录 UI（数据存了但没做浏览页）
- 多岗位切换面试
