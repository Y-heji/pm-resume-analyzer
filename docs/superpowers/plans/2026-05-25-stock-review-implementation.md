# Stock Review System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a daily stock market review system that auto-fetches data via AkShare, generates AI-powered 10-section analysis, and displays it on a Next.js dashboard.

**Architecture:** Python FastAPI reads AkShare → pandas computes benchmarks → DeepSeek generates analysis → JSON stored → Next.js dashboard displays

**Tech Stack:** Python 3.12, FastAPI, AkShare, pandas, Next.js 16, TailwindCSS, shadcn/ui, ECharts, DeepSeek API

---

### Task 1: Project Scaffold

**Files:**
- Create: `d:\stock-review\pyproject.toml`
- Create: `d:\stock-review\.env.example`
- Create: `d:\stock-review\README.md`

- [ ] **Step 1: Create project directory and Python project file**

```bash
mkdir -p d:\stock-review
```

Create `d:\stock-review\pyproject.toml`:
```toml
[project]
name = "stock-review"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi",
    "uvicorn",
    "akshare",
    "pandas",
    "numpy",
    "httpx",
    "openai",
]
```

- [ ] **Step 2: Create env template**

Create `d:\stock-review\.env.example`:
```
DEEPSEEK_API_KEY=sk-your-key
```

- [ ] **Step 3: Install dependencies**

```bash
cd d:\stock-review && pip install -e .
```

---

### Task 2: Data Engine — Market Overview Fetcher

**Files:**
- Create: `d:\stock-review\data_engine\fetch_market.py`

- [ ] **Step 1: Write the market data fetcher**

Create `d:\stock-review\data_engine\__init__.py` (empty).

Create `d:\stock-review\data_engine\fetch_market.py`:
```python
"""Fetch market overview data: indices, volume, breadth, limit-up stats."""
import akshare as ak
import pandas as pd
from datetime import datetime

def fetch_index_data() -> dict:
    """Fetch Shanghai, ChiNext, BeiJiao index data."""
    df = ak.stock_zh_index_daily(symbol="sh000001")  # 上证
    today = df.iloc[-1]
    return {
        "sh_close": float(today["close"]),
        "sh_pct": float(today["pct_chg"]),
        "sh_volume": float(today["volume"]),
    }

def fetch_market_breadth() -> dict:
    """涨跌家数、涨停跌停数、炸板率."""
    df = ak.stock_zh_a_spot_em()
    up_count = len(df[df["涨跌幅"] > 0])
    down_count = len(df[df["涨跌幅"] < 0])
    limit_up = len(df[df["涨跌幅"] >= 9.9])
    limit_down = len(df[df["涨跌幅"] <= -9.9])
    return {
        "up_count": up_count,
        "down_count": down_count,
        "limit_up": limit_up,
        "limit_down": limit_down,
        "breadth_ratio": round(up_count / max(down_count, 1), 2),
    }

def fetch_north_flow() -> dict:
    """北向资金."""
    df = ak.stock_hsgt_north_net_flow_in_em()
    today = df.iloc[-1]
    return {
        "net_flow": float(today["value"]),
        "date": str(today["date"]),
    }

def run_market_fetch(date: str = "") -> dict:
    """Run all market fetches, return combined dict."""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    return {
        "date": date,
        "index": fetch_index_data(),
        "breadth": fetch_market_breadth(),
        "north_flow": fetch_north_flow(),
    }
```

- [ ] **Step 2: Test manually**

```bash
cd d:\stock-review && python -c "from data_engine.fetch_market import run_market_fetch; import json; print(json.dumps(run_market_fetch(), indent=2, ensure_ascii=False))"
```

Expected: JSON with index, breadth, north_flow data printed.

---

### Task 3: Data Engine — Sector & Stock Fetcher

**Files:**
- Create: `d:\stock-review\data_engine\fetch_sector.py`

- [ ] **Step 1: Write sector + leading stocks fetcher**

Create `d:\stock-review\data_engine\fetch_sector.py`:
```python
"""Fetch sector rankings and leading stocks."""
import akshare as ak
import pandas as pd

def fetch_sector_ranking() -> list[dict]:
    """板块涨幅排行 top 20."""
    df = ak.stock_board_concept_name_em()
    top = df.nlargest(20, "涨跌幅")
    return [
        {
            "name": row["板块名称"],
            "pct": float(row["涨跌幅"]),
            "volume": float(row["总市值"]),
            "leading_stock": row["领涨股票"],
        }
        for _, row in top.iterrows()
    ]

def fetch_limit_up_pool() -> list[dict]:
    """涨停池：涨停股、连板数、封单量."""
    df = ak.stock_zt_pool_em(date="")
    return [
        {
            "name": row["名称"],
            "code": row["代码"],
            "pct": float(row["涨跌幅"]),
            "board_count": int(row["连板数"]) if "连板数" in df.columns else 1,
            "turnover": float(row["换手率"]) if "换手率" in df.columns else 0,
        }
        for _, row in df.iterrows()
    ]

def fetch_top_volume_stocks(n: int = 20) -> list[dict]:
    """成交额 top N."""
    df = ak.stock_zh_a_spot_em()
    top = df.nlargest(n, "成交额")
    return [
        {"name": row["名称"], "code": row["代码"], "volume": float(row["成交额"]),
         "pct": float(row["涨跌幅"])}
        for _, row in top.iterrows()
    ]

def run_sector_fetch() -> dict:
    return {
        "sectors": fetch_sector_ranking(),
        "limit_up_pool": fetch_limit_up_pool(),
        "top_volume": fetch_top_volume_stocks(),
    }
```

- [ ] **Step 2: Test**

```bash
cd d:\stock-review && python -c "from data_engine.fetch_sector import run_sector_fetch; import json; print(json.dumps(run_sector_fetch(), indent=2, ensure_ascii=False)[:2000])"
```

Expected: sector ranking and limit-up pool JSON.

---

### Task 4: AI Analysis Layer

**Files:**
- Create: `d:\stock-review\ai_engine\analyze.py`
- Create: `d:\stock-review\ai_engine\prompt.py`

- [ ] **Step 1: Write AI prompt builder**

Create `d:\stock-review\ai_engine\__init__.py` (empty).

Create `d:\stock-review\ai_engine\prompt.py`:
```python
SYSTEM_PROMPT = """你是资深A股交易分析师，擅长市场情绪判断、板块轮动分析、资金行为解读。

## 输出要求
1. 用数据说话，不要空泛描述。每个判断引用具体数字
2. 语言简洁专业，像职业交易员的复盘笔记
3. 市场情绪必须量化判断：冰点/修复/主升/分歧/退潮
4. 板块分析需要指出：持续性、资金从哪来、是否一致性
5. 给出明日的关键观测点（具体的板块/个股/量能信号）

## 输出格式（严格JSON）
{
  "market_emotion": {
    "stage": "修复/主升/分歧等",
    "score": 0-100,
    "summary": "一句话情绪总结"
  },
  "main_lines": ["主线1", "主线2"],
  "sector_analysis": "板块轮动与持续性分析，2-3句",
  "fund_flow_analysis": "资金行为解读，2-3句",
  "risk_signals": ["风险信号1", "风险信号2"],
  "tomorrow_watch": ["明日观察点1", "明日观察点2"],
  "full_summary": "完整市场总结，5-8句"
}
"""

def build_analysis_prompt(market_data: dict, sector_data: dict) -> str:
    return f"""分析以下A股市场数据，生成专业复盘。

=== 市场数据 ===
{market_data}

=== 板块与个股数据 ===
{sector_data}

请输出 JSON 格式的分析报告。"""
```

- [ ] **Step 2: Write AI analysis runner**

Create `d:\stock-review\ai_engine\analyze.py`:
```python
"""Call DeepSeek API to generate market analysis."""
import json
import os
from openai import OpenAI
from .prompt import SYSTEM_PROMPT, build_analysis_prompt

_client = None

def get_client():
    global _client
    if not _client:
        _client = OpenAI(
            base_url="https://api.deepseek.com/v1",
            api_key=os.environ["DEEPSEEK_API_KEY"],
        )
    return _client

def extract_json(text: str) -> str:
    m = __import__("re").search(r"\{[\s\S]*\}", text)
    if m: return m.group(0)
    return text

def run_analysis(market_data: dict, sector_data: dict) -> dict:
    client = get_client()
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_analysis_prompt(market_data, sector_data)},
        ],
        temperature=0.4,
        max_tokens=4000,
    )
    text = resp.choices[0].message.content or ""
    return json.loads(extract_json(text))
```

- [ ] **Step 3: Test (requires DEEPSEEK_API_KEY set)**

```bash
cd d:\stock-review && python -c "
from data_engine.fetch_market import run_market_fetch
from data_engine.fetch_sector import run_sector_fetch
from ai_engine.analyze import run_analysis
import json
m = run_market_fetch()
s = run_sector_fetch()
r = run_analysis(m, s)
print(json.dumps(r, indent=2, ensure_ascii=False))
"
```

Expected: AI-generated analysis JSON printed.

---

### Task 5: Orchestrator — Full Pipeline Script

**Files:**
- Create: `d:\stock-review\run_review.py`

- [ ] **Step 1: Write the pipeline runner**

Create `d:\stock-review\run_review.py`:
```python
#!/usr/bin/env python3
"""Run full stock review pipeline: fetch → analyze → save."""
import json
import os
from datetime import datetime
from data_engine.fetch_market import run_market_fetch
from data_engine.fetch_sector import run_sector_fetch
from ai_engine.analyze import run_analysis

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    out_dir = f"data/{today}"
    os.makedirs(out_dir, exist_ok=True)

    # Fetch
    print("[1/3] Fetching market data...")
    market = run_market_fetch()
    print("[2/3] Fetching sector data...")
    sector = run_sector_fetch()

    # Save raw
    with open(f"{out_dir}/market.json", "w", encoding="utf-8") as f:
        json.dump(market, f, ensure_ascii=False, indent=2)
    with open(f"{out_dir}/sector.json", "w", encoding="utf-8") as f:
        json.dump(sector, f, ensure_ascii=False, indent=2)

    # Analyze
    print("[3/3] Running AI analysis...")
    analysis = run_analysis(market, sector)

    # Save report
    report = {"date": today, "market": market, "sector": sector, "analysis": analysis}
    with open(f"{out_dir}/report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Report saved to {out_dir}/report.json")
    print(analysis.get("full_summary", ""))

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run and verify**

```bash
cd d:\stock-review && python run_review.py
```

Expected: Creates `data/2026-05-25/report.json`.

---

### Task 6: Next.js Dashboard Page

**Files:**
- Create: `d:\stock-review\web\app\page.tsx`
- Create: `d:\stock-review\web\app\layout.tsx`
- Create: `d:\stock-review\web\package.json`
- Create: `d:\stock-review\web\next.config.ts`

Note: This is a SEPARATE Next.js project from PM Resume Analyzer. It runs on a different port.

- [ ] **Step 1: Create Next.js project**

```bash
cd d:\stock-review && npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
cd web && npm install echarts echarts-for-react
```

- [ ] **Step 2: Write the dashboard page**

Create `d:\stock-review\web\app\page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

interface ReportData {
  date: string;
  analysis: {
    market_emotion: { stage: string; score: number; summary: string };
    main_lines: string[];
    sector_analysis: string;
    fund_flow_analysis: string;
    full_summary: string;
    risk_signals: string[];
    tomorrow_watch: string[];
  };
  market: {
    breadth: { limit_up: number; limit_down: number; up_count: number; down_count: number };
    north_flow: { net_flow: number };
    index: { sh_pct: number };
  };
}

async function loadReport(): Promise<ReportData | null> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(`/data/${today}/report.json`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default function Dashboard() {
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => { loadReport().then(setReport); }, []);

  if (!report) {
    return <div className="p-10 text-gray-500">Loading report...</div>;
  }

  const a = report.analysis;
  const m = report.market;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">市场复盘</h1>
        <p className="text-sm text-gray-400">{report.date}</p>
      </div>

      {/* Emotion */}
      <div className={`rounded-xl p-6 ${a.market_emotion.stage.includes("主升") ? "bg-emerald-50" : a.market_emotion.stage.includes("退潮") ? "bg-red-50" : "bg-gray-50"}`}>
        <p className="text-sm text-gray-400">情绪阶段</p>
        <p className="text-2xl font-bold">{a.market_emotion.stage} · {a.market_emotion.score}/100</p>
        <p className="text-sm text-gray-600 mt-1">{a.market_emotion.summary}</p>
      </div>

      {/* Breadth stats */}
      <div className="grid grid-cols-5 gap-3 text-center">
        {[
          ["涨停", m.breadth.limit_up],
          ["跌停", m.breadth.limit_down],
          ["上涨", m.breadth.up_count],
          ["下跌", m.breadth.down_count],
          ["北向(亿)", (m.north_flow.net_flow / 1e8).toFixed(1)],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-xl border p-3">
            <p className="text-lg font-bold">{String(value)}</p>
            <p className="text-xs text-gray-400">{label as string}</p>
          </div>
        ))}
      </div>

      {/* Main lines */}
      <div className="flex gap-2 flex-wrap">
        {a.main_lines.map((line) => (
          <span key={line} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{line}</span>
        ))}
      </div>

      {/* Analysis sections */}
      <Section title="板块分析" content={a.sector_analysis} />
      <Section title="资金分析" content={a.fund_flow_analysis} />
      <Section title="市场总结" content={a.full_summary} />

      {/* Risk + Tomorrow */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">风险信号</p>
          <ul className="text-sm text-red-600 space-y-1">
            {a.risk_signals.map((s, i) => <li key={i}>· {s}</li>)}
          </ul>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-700 mb-2">明日观察</p>
          <ul className="text-sm text-blue-600 space-y-1">
            {a.tomorrow_watch.map((s, i) => <li key={i}>· {s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-sm font-semibold text-gray-400 mb-2">{title}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  );
}
```

- [ ] **Step 3: Setup Next.js to serve data dir**

Symlink the data directory so Next.js can serve the JSON files:

```bash
cd d:\stock-review\web\public && mkdir data 2>/dev/null; rm data 2>/dev/null; ln -s ../../data data
```

- [ ] **Step 4: Run frontend**

```bash
cd d:\stock-review\web && npm run dev -- -p 3001
```
Open http://localhost:3001 — dashboard should display the latest report.

---

### Task 7: Integrate AI report into existing dashboard

Add a link from PM Resume Analyzer to the stock dashboard, and add stock dashboard link.

Since stock-review is a separate project, this step is optional. The dashboard runs independently at localhost:3001.

---

## Execution

**Plan complete.** `npm run build` not applicable — this is a Python + separate Next.js project.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — Execute tasks in this session using executing-plans

Which approach?
