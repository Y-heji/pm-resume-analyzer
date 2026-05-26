# AI Quant Research Platform — Architecture Design

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  /stock (Terminal)  /stock/quant (Factors)          │
│  ECharts · Tailwind · Linear Dark Theme             │
├─────────────────────────────────────────────────────┤
│                  Next.js API Routes                  │
│  /api/stock-report  /api/trade  /api/quant          │
├─────────────────────────────────────────────────────┤
│              Python Quant Engine                     │
│  quant/factors.py · quant/backtest.py               │
│  data_engine/fetch_*.py · ai_engine/analyze.py      │
├─────────────────────────────────────────────────────┤
│              SQLite (MVP) → PostgreSQL (Scale)       │
│  trade.db · factors · strategies · positions         │
├─────────────────────────────────────────────────────┤
│                 External Data                        │
│  AkShare · East Money API (curl) · News RSS          │
│  DeepSeek AI · (future: ClickHouse for tick data)   │
└─────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
d:\stock-review\                    # Python quant engine
├── data_engine/
│   ├── fetch_market.py             # 指数/涨跌/北向
│   ├── fetch_sector.py             # 板块/涨停/龙头/资金流
│   ├── fetch_kline.py              # 日线+60分钟K线
│   └── fetch_news.py               # 新闻抓取(东方财富/财联社/新浪)
├── ai_engine/
│   └── analyze.py                  # DeepSeek 复盘+新闻联动
├── quant/
│   ├── factors.py                  # 20经典因子定义+注册表
│   ├── backtest.py                 # 日频回测+评估
│   ├── factory.py                  # [Phase 2] AI自动生成因子
│   ├── regime.py                   # [Phase 3] 市场状态识别
│   └── optimize.py                 # [Phase 3] 多因子组合优化
├── run_review.py                   # 复盘管道
└── data/                           # 缓存数据
    ├── {date}/report.json
    ├── {date}/market.json
    ├── kline_sh_60.json
    ├── kline_60m_20.json
    └── factors.json

d:\pm-resume-analyzer\              # Next.js
├── app/stock/page.tsx              # 主终端页
├── app/stock/quant/page.tsx        # 因子研究中心
├── app/api/stock-report/route.ts   # 复盘数据API
├── app/api/trade/route.ts          # 交易API
├── app/api/trade/analyze/route.ts  # AI策略分析
├── app/api/quant/route.ts          # 因子API
├── lib/trade-db.ts                 # SQLite交易数据库
└── components/                      # 可复用组件
```

## 3. 数据库设计 (SQLite → PostgreSQL)

```sql
-- 交易系统
accounts(id, name, initial_capital, cash, created_at)
positions(id, account_id, code, name, shares, avg_cost, current_price, updated_at)
trades(id, account_id, code, name, action, shares, price, amount, logic, emotion_stage, sector, ai_analysis, created_at)
strategies(id, name, description, rules, total_trades, wins, total_return, max_drawdown, win_rate, profit_loss_ratio, active, created_at)

-- [Phase 2] 因子工厂
factor_pool(id, name, expression, category, status, created_at)
factor_scores(id, factor_id, date, ic, rank_ic, sharpe, annual_return, max_drawdown)

-- [Phase 3] 市场状态
regime_log(id, date, state, confidence, features_json)
```

## 4. 前后端模块划分

| 模块 | 前端 | API | Python |
|------|------|-----|--------|
| 市场复盘 | /stock 终端页 | /api/stock-report | run_review.py |
| 模拟交易 | TradePanel 组件 | /api/trade | lib/trade-db.ts |
| AI策略分析 | StrategyPanel 组件 | /api/trade/analyze | DeepSeek API |
| 因子研究 | /stock/quant 面板 | /api/quant | quant/backtest.py |
| AI因子生成[P2] | 因子工厂面板 | /api/quant/factory | quant/factory.py |
| 市场状态[P3] | Regime面板 | /api/quant/regime | quant/regime.py |

## 5. API 结构

```
GET    /api/stock-report           → 最新复盘JSON
POST   /api/trade?action=account   → 账户状态
POST   /api/trade  body={action:"order",...} → 下单
POST   /api/trade/analyze          → AI策略分析
GET    /api/quant                  → 因子评估列表
POST   /api/quant                  → 重新评估

[Phase 2]
POST   /api/quant/factory          → AI生成新因子
DELETE /api/quant/factory/:id      → 淘汰因子

[Phase 3]
GET    /api/quant/regime           → 当前市场状态
```

## 6. AI Agent 工作流

```
数据抓取(收盘后)
  ↓
市场复盘生成(AI) → /stock 终端
  ↓
因子计算 → 回测 → IC评估 → 排序 → /stock/quant 面板
  ↓ (Phase 2)
AI因子工厂: 基础因子 → 遗传组合 → 回测 → 筛选 → 入库
  ↓ (Phase 3)  
市场状态识别: 波动率/趋势/情绪 → HMM → Regime标签
  ↓
策略自适应: Regime → 因子权重动态调整 → 模拟交易验证 → 反馈
```

## 7. 开发优先级

| 优先级 | 模块 | 状态 |
|--------|------|------|
| P0 | AI 复盘 + 情绪 | ✅ |
| P0 | 模拟交易 + 策略统计 | ✅ |
| P0 | 20 经典因子 + 回测 | ✅ |
| P0 | 新闻联动 | ✅ |
| P1 | AI 因子工厂 (遗传编程) | 下一步 |
| P1 | 市场状态识别 (HMM) | |
| P1 | 多因子组合优化 | |
| P2 | 分钟级回测 | |
| P2 | 基本面数据 | |
| P3 | Tick数据 · Level2 | |
| P3 | 强化学习 (PPO/DQN) | |
| P3 | RAG 检索 (Alpha101) | |
| P3 | PostgreSQL · ClickHouse | |

## 8. MVP 方案 (当前已完成)

- 复盘终端 (Linear dark theme, ECharts K线+资金流)
- 模拟交易 (SQLite, 100万初始资金, 买卖/止盈止损/持仓/日志)
- 因子研究面板 (20因子, IC/Sharpe评估, 排序/Top5)
- AI 策略分析 (DeepSeek)

## 9. 可扩展架构

- 因子引擎: `FACTOR_REGISTRY` 字典 → 新因子只需加一行
- 回测引擎: `run_backtest()` 接受任意 factor Series → 即插即用
- 前端: 每个功能独立路由 /stock /stock/quant
- 数据库: SQLite → PostgreSQL 迁移只需改连接字符串
- Python ↔ Next.js: 通过 JSON 文件 + curl subprocess 解耦

## 10. 开发计划

**Phase 2: AI 因子工厂 (2周)**
- 因子表达式解析器
- Genetic Programming: 随机组合基础因子 → 变异 → 交叉 → 回测 → 筛选
- 因子池管理 (active/deprecated)
- 前端因子工厂面板

**Phase 3: 市场状态识别 (2周)**
- HMM 2/3-state 训练 (趋势/震荡/高波)
- 波动率 Regime Detection
- 动态因子权重: Regime A → 趋势因子, Regime B → 反转因子
- 前端 Regime 面板
