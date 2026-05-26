# PM Resume Analyzer

## 最新进度 (2026-05-26)

### PM Resume Analyzer (主项目)
- Full Rewrite Engine 已完成: 模块化 Prompt 系统 + 8 模块类型 + 增强 UI
- PDF/Word 导出功能已添加
- Vercel 环境变量已配置: DEEPSEEK_API_KEY + ADMIN_KEY
- 权限已全部放开 (.claude/settings.json)

### Stock Review Terminal (AI 复盘 + 量化 + 模拟交易)
- 前端: app/stock/ (主看板) + app/stock/quant/ (因子研究)
- Python 引擎: ../stock-review/ (quant/ + data_engine/ + ai_engine/)
- 模拟交易: SQLite (data/trade.db), 100万初始资金, 支持策略回测 + AI 分析
- 量化系统: 因子回测、因子工厂(pairwise组合)、组合优化、regime 检测、AI 建议
- 最新数据: 2026-05-26 日

### 待处理
- 大量未提交改动 (git status 有 20+ 文件)
- 旧项目文件夹待清理

## 项目概述

Next.js 16 + DeepSeek AI 的 PM 简历分析与优化工具，内置股票复盘终端 + 量化因子研究 + 模拟交易系统。

**技术栈**: Next.js 16, React 19, Tailwind CSS 4, DeepSeek API, pdfjs-dist, Upstash Redis, better-sqlite3, ECharts, Python 3.14

**部署**: Vercel, 域名 ai职业经理师.xyz

## 用户偏好

- GitHub: Y-heji / T-heji | Windows 10, 国内网络
- MVP 验证阶段，不要支付/会员系统
- 要具体步骤和链接，不要只讲概念
- 偏好极简设计风格
- 股市配色: 红涨绿跌 (中国习惯)
