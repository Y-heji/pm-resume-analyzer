# AI Stock Market Analysis Terminal — Design Doc

## Visual Language: Linear Dark × TradingView Data Density

**Source:** Linear.app DESIGN.md tokens, adapted for financial terminal use.

| Token | Value | Usage |
|-------|-------|-------|
| canvas | `#010102` | Page background |
| surface-1 | `#0f1011` | Card/Panel background |
| surface-2 | `#141516` | Table row alternate |
| hairline | `#23252a` | Borders, dividers |
| ink | `#f7f8f8` | Primary text |
| ink-muted | `#d0d6e0` | Secondary text |
| ink-subtle | `#8a8f98` | Labels, metadata |
| primary | `#5e6ad2` | Active/selected states, links |
| success | `#27a644` | Positive % changes |
| danger | `#f85149` | Negative % changes |
| warning | `#d29922` | Risk signals |

## Typography (Linear system, adapted)
- Display: SF Pro Display / system-ui, 24px/600 for section headers
- Body: system-ui, 13px/400 for data tables
- Mono: JetBrains Mono, 12px for tickers/codes
- Number: tabular-nums, red/green coloring for pct

## 4-Column Trading Terminal Layout

```
┌──────────────────────────────────────────────────────────┐
│ TOP BAR: ● LIVE | 上证 4152 +0.96% | 创业板 3939 +2.84% │
├──────────┬──────────┬──────────┬─────────────────────────┤
│ EMOTION  │ INDEX    │ VOLUME   │ AI SUMMARY              │
│ 主升 85  │ sh 4152  │ 6159亿   │ 今日科技主线主升行情…    │
│          │ +0.96%   │ 北向+50亿│                         │
├──────────┴──────────┴──────────┴─────────────────────────┤
│ [AI算力] [PCB] [电力] [存储] [机器人]                    │
├─────────────────────┬────────────────────────────────────┤
│ ⇧ SECTOR HEATMAP   │ ⇨ NEWS → IMPACT                    │
│ ████████ 半导体+5.2│ · 英伟达上涨 → AI算力受益           │
│ ██████   PCB +3.8  │ · 电力政策 → 电力板块异动            │
│ █████    AI  +2.9  │                                     │
├─────────────────────┴────────────────────────────────────┤
│ LEADING STOCKS                                            │
│ # │ Code │ Name │ ±% │ Board │ Vol │ Logic               │
│ 1 │ 002… │ 深科技│+10%│  3连  │ 32亿│ 芯片龙头            │
├─────────────────────┬────────────────────────────────────┤
│ ⇈ K-LINE (60d)     │ ⚠ RISK + ☀ TOMORROW                │
│ candlestick chart   │ · 高位分歧风险                      │
│ with MA5/MA10/MA20  │ · 观察科技持续性                    │
└─────────────────────┴────────────────────────────────────┘
```

## Architecture (unchanged)
AkShare → Python pipeline → report.json → /api/stock-report → Next.js /stock page

## Files to Create/Modify
- `app/stock/page.tsx` — Complete rewrite, dark terminal layout
- `data_engine/fetch_kline.py` — New: fetch candlestick data for charts
- `/api/stock-report/route.ts` — Extend to serve kline data

## Out of Scope (Phase B)
Paper trading, strategy backtesting, PostgreSQL, real-time streaming
