# AI 职业访谈 — 简历生成模块 技术设计

> 状态：待审批 | 日期：2026-06-08 | 对标：快跑啊小卢_ 工具教程型产品逻辑

---

## 一、架构总览

```
                      ┌─────────────────────────┐
                      │     State Machine        │
                      │   (5 阶段 × 状态机)       │
                      └───────────┬─────────────┘
                                  │
  ┌──────────┐    ┌──────────┐    │    ┌──────────┐    ┌──────────────┐
  │ 阶段 1    │ → │ 阶段 2    │ → │阶段 3│ → │ 阶段 4     │ → │ 阶段 5        │
  │ 基础信息  │    │ 职业定位  │    │经历  │    │ 项目经历   │    │ 技能证书      │
  │ 5 字段    │    │ 4 字段    │    │挖掘  │    │  × N       │    │ + 能力库对照  │
  └──────────┘    └──────────┘    └──────┘    └──────────┘    └──────────────┘
                                                                  │
                                                          ┌───────▼───────┐
                                                          │  AI 生成简历   │
                                                          │  + Top10 推荐  │
                                                          └───────┬───────┘
                                                                  │
                                                          ┌───────▼───────┐
                                                          │  现有优化流程   │
                                                          └───────────────┘
```

---

## 二、状态机设计

5 个阶段，每个阶段独立状态。用 Redis 存储会话上下文。

```
Stage 1: BASIC_INFO     → 采集姓名/学历/学校/专业/毕业时间/求职状态
Stage 2: CAREER_TARGET  → 采集岗位/行业/城市/薪资 + AI 推荐分流
Stage 3: EXPERIENCE     → 循环：添加经历 → AI 追问 → 确认 → 可继续添加
Stage 4: PROJECTS       → 循环：添加项目 → AI 追问 → 确认 → 可继续添加
Stage 5: SKILLS         → 技能标记 + 能力库对照 + 证书 → 生成简历
```

**状态转换**：用户点击「下一步」触发 state transition，每个 stage 可独立回退。

---

## 三、页面结构

### 新页面：`/interview-gen`

单页应用，不跳转。5 个阶段通过状态机在同一页切换。

| 组件 | 职责 |
|------|------|
| `InterviewWizard` | 主容器，管理 stage 状态 |
| `StageBasicInfo` | 阶段 1 — 表单 |
| `StageCareerTarget` | 阶段 2 — 表单 + 推荐 |
| `StageExperience` | 阶段 3 — 循环添加 + 追问 |
| `StageProjects` | 阶段 4 — 循环添加 + 追问 |
| `StageSkills` | 阶段 5 — 技能标记 + 对照 |
| `ResumePreview` | 最终预览 |
| `CareerRecommendation` | Top 10 岗位推荐 |

### 入口位置

首页 `/` 新增按钮 + `/analyze` 页面新增入口（**方案 C**）。

---

## 四、数据库设计

### Redis 存储（新增 key）

```
interview_session:<sessionId>
  - stage: string           // 当前阶段
  - basic_info: {}          // 阶段1数据
  - career_target: {}       // 阶段2数据
  - experiences: []         // 阶段3数据
  - projects: []            // 阶段4数据
  - skills: {}              // 阶段5数据
  - generated_resume: {}    // 最终生成的简历
  - recommendations: []     // Top10 推荐
  - created_at: timestamp
  - updated_at: timestamp
  TTL: 24h（访谈超时自动清理）
```

### 与现有模块衔接

访谈结束后，生成的简历写入 `analysis:<id>` 格式，可直接进入现有 `/rewrite/[id]` 流程。

---

## 五、API 设计

### 新增 API Routes

```
POST   /api/interview-gen/start     → 初始化会话
POST   /api/interview-gen/next      → 提交当前阶段，获取下一阶段
POST   /api/interview-gen/followup  → AI 追问（单条经历/项目的追问）
POST   /api/interview-gen/generate  → 生成简历 + 推荐
GET    /api/interview-gen/session   → 获取当前会话状态
POST   /api/interview-gen/back      → 回退到上一阶段
```

### 关键 API 详细设计

#### `POST /api/interview-gen/next`
```
Request:  { sessionId, stage, data }
Response: {
  nextStage: "CAREER_TARGET",
  aiMessage: "基本信息已记录。接下来...",
  suggestions?: []  // 仅阶段2，AI推荐岗位
}
```

#### `POST /api/interview-gen/followup`
```
Request:  { sessionId, experienceIndex, experienceData }
Response: {
  questions: [
    "这段经历里，有没有一个具体项目特别有成就感？",
    "有没有可以用数字衡量的成果？",
    "你在这个过程中学到了什么工具或方法？"
  ]
}
```

追问逻辑：
- 检查用户输入是否包含：数据/成果/工具/团队规模
- 缺失项 → AI 生成针对性追问
- 每次最多返回 3 个追问
- 追问成本：~200 token/output

---

## 六、AI 追问引擎（核心）

### 逻辑流程

```
用户提交一段经历
    ↓
检测 STAR 完整性
  - Situation：有（公司/岗位）
  - Task：有（负责什么）
  - Action：有（做了什么）  ← 如果缺失 → 追问"你怎么做的？"
  - Result：有（数字/成果）  ← 如果缺失 → 追问"有没有可量化的结果？"
    ↓
每个缺失维度生成 1 个追问
最多 3 个
    ↓
返回追问列表
```

### Prompt 策略

```
System: 你是专业的简历顾问。用户正在填写一段工作经历。
根据用户已经写的内容，找出 STAR 中缺失的信息，生成 2-3 个追问。
追问要求：口语化、引导性强、不超过 20 字。

User: [经历内容]

Output: JSON 格式，{ "questions": [] }
```

---

## 七、岗位能力库

内嵌在代码中的 JSON 常量（不调 AI，零延迟）。

```typescript
const SKILL_LIBRARY = {
  "产品经理": ["需求分析","原型设计","数据分析","项目推进","用户研究","A/B测试","竞品分析","PRD撰写"],
  "运营": ["内容运营","用户运营","数据分析","活动策划","社群运营","跨部门沟通","私域运营","增长黑客"],
  "前端开发": ["HTML/CSS","JavaScript","React/Vue","Git","Webpack","性能优化","跨端开发"],
  "数据分析": ["SQL","Python","Excel","Tableau","统计学","AB测试","数据可视化","机器学习"],
  "设计": ["UI设计","UX研究","Figma","设计系统","交互原型","用户访谈","可用性测试"],
}
```

功能：
- 阶段 2：根据用户专业 + 学历，从能力库匹配推荐岗位
- 阶段 5：根据目标岗位，列出「应该具备但未覆盖」的能力作为友情提醒
- 不捏造：未覆盖的能力只提示，不写入简历

---

## 八、简历生成

### 输出结构

```json
{
  "selfEvaluation": "AI 综合所有经历生成的自我评价",
  "education": [{ "school", "major", "degree", "time", "gpa" }],
  "experiences": [{ "company", "title", "time", "bullets": [] }],
  "projects": [{ "name", "background", "role", "tools", "results": [] }],
  "skills": ["技能1", "技能2"],
  "certificates": ["证书1"],
  "languages": ["语言能力"]
}
```

### 生成方式

调用 DeepSeek API（复用 `lib/ai.ts`），将结构化访谈数据转为简历文本。成本约 ~500 token/次。

---

## 九、职业推荐

根据 `专业 + 学历 + 技能 + 经历 → Top10 岗位`，每个岗位带：

- 推荐原因（1 句话）
- 匹配度评分（0-100%）
- 需要补充的能力

同样用 DeepSeek 生成，成本约 ~300 token/次。

---

## 十、与现有模块的整合

### 入口变化

| 位置 | 改动 |
|------|------|
| `app/page.tsx` | 新增「还没有简历？AI 帮你生成」按钮 |
| `app/analyze/page.tsx` | 上传区域旁新增入口 |
| `app/layout.tsx` | 无需改动 |

### 流程衔接

```
访谈完成 → 生成简历 → 自动创建 analysis 记录 → 可进入 /rewrite/[id] 优化
```

现有 `/api/analyze`、`/api/rewrite` 无需改动。

---

## 十一、开发排期

| 阶段 | 内容 | 预估 |
|------|------|------|
| **Phase 1** | 状态机 + 5 阶段页面骨架 + 基础表单 | 1 天 |
| **Phase 2** | AI 追问引擎 + 追问 UI | 0.5 天 |
| **Phase 3** | 岗位能力库 + 技能对照 | 0.5 天 |
| **Phase 4** | 简历生成 + 职业推荐 | 0.5 天 |
| **Phase 5** | 首页/分析页入口 + 与现有流程衔接 | 0.5 天 |
| **Phase 6** | 测试 + 修复 + 部署 | 0.5 天 |

**总计：约 3.5 天**

---

## 十二、技术决策总结

| 决策 | 选择 | 原因 |
|------|------|------|
| 交互模式 | 状态机 + 表单 | 不聊天，降 Token 成本 |
| AI 追问 | 后端 LLM 驱动 | 追问质量 > 追加成本 |
| 岗位推荐 | LLM 生成 | 需要综合判断 |
| 能力库 | 前端常量 | 零延迟，确定性 |
| 存储 | Redis + TTL 24h | 与现有架构一致 |
