# PM Resume Analyzer

AI 驱动产品经理求职分析工具 —— 上传简历 + 粘贴 JD，自动完成匹配度分析、ATS 风险检测、技能缺口识别和学习路径规划。

**技术栈**: Next.js 16 · React 19 · DeepSeek AI · Tailwind CSS 4 · Upstash Redis

## 核心功能

- **PDF 简历解析** — 上传简历 PDF，自动提取文本
- **AI 匹配分析** — DeepSeek 驱动，多维简历 vs JD 匹配度评估
- **ATS 风险检测** — 识别关键词缺失、格式问题
- **缺失技能分析** — 按重要性列出需要补充的技能
- **学习路径规划** — 带具体学习资源的分优先级路径
- **AI 简历改写** — STAR 法则 + 数据化 + ATS 关键词逐段优化
- **Waitlist 预约** — 收集用户邮箱验证解锁需求

## 本地运行

```bash
# 安装依赖
npm install

# 配置环境变量（复制 .env.local 并填入真实值）
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key，在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 获取 |
| `ADMIN_KEY` | 是 | 管理页 `/admin` 的访问密码，自定义字符串 |
| `UPSTASH_REDIS_REST_URL` | 仅 Vercel | Upstash Redis REST URL（Vercel Marketplace 安装后自动注入） |
| `UPSTASH_REDIS_REST_TOKEN` | 仅 Vercel | Upstash Redis REST Token（Vercel Marketplace 安装后自动注入） |

## Vercel 部署

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "MVP: PM Resume Analyzer"
gh repo create pm-resume-analyzer --public --source=. --push
```

### 2. 在 Vercel 中导入项目

1. 打开 [vercel.com/new](https://vercel.com/new)
2. 选择 GitHub 仓库 `pm-resume-analyzer`
3. Vercel 自动识别 Next.js，无需改构建配置

### 3. 配置环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

- `DEEPSEEK_API_KEY` — 你的 DeepSeek API Key
- `ADMIN_KEY` — 自定义管理密码

### 4. 设置 Upstash Redis（waitlist 功能必需）

1. 在 Vercel 项目 Dashboard 点击 **Storage**
2. 选择 **Upstash Redis** → Create
3. 环境变量 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 会自动注入

### 5. 部署

推送新代码或手动点击 **Redeploy**。默认分支自动部署到生产环境。

## 管理后台

访问 `/admin`，输入 `ADMIN_KEY` 环境变量中设置的密码，可查看 waitlist 预约数据。

## 项目结构

```
├── app/
│   ├── admin/          # 管理后台
│   ├── analyze/        # 分析页（上传简历 + JD）
│   ├── result/[id]/    # 分析报告页
│   ├── rewrite/[id]/   # AI 简历改写页
│   └── api/
│       ├── analyze/    # DeepSeek 分析接口
│       ├── parse-pdf/  # PDF 解析接口
│       ├── rewrite/    # AI 改写接口
│       └── waitlist/   # 预约接口
├── components/         # React UI 组件
├── lib/
│   ├── ai.ts           # DeepSeek 调用
│   ├── rewrite.ts      # 简历改写 AI
│   ├── analytics.ts    # 埋点
│   ├── waitlist-storage.ts  # 存储适配（本地 fs / Vercel Upstash）
│   └── pdf-parser.ts   # PDF 解析
└── public/             # 静态资源
```
