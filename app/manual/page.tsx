export default function ManualPage() {
  return (
    <div className="manual" style={{ fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif", color: "#111", lineHeight: 1.8, maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <style>{`@page { size: A4; margin: 24mm 20mm; } @media print { .pb { page-break-before: always; } }`}</style>

      {/* ═══ Cover ═══ */}
      <div style={{ textAlign: "center", paddingTop: 80, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>AI Quant Research Platform</h1>
        <p style={{ fontSize: 20, color: "#555", marginBottom: 40 }}>AI 量化研究平台 · 系统说明书</p>
        <p style={{ fontSize: 13, color: "#888" }}>Version 1.0 · 2026-05-25</p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>技术栈: Next.js 16 + Python + DeepSeek AI + ECharts + SQLite</p>
      </div>

      {/* ═══ TOC ═══ */}
      <div><h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 16 }}>目录</h2>
      {["系统架构","市场复盘子系统","因子引擎","因子工厂","回测系统","因子清洗管线","多因子组合","市场状态识别","模拟交易系统","AI 策略分析","AI 量化建议","K 线图表","前端终端","技术栈","目录结构","快速开始","后续发展方向"].map((s,i)=>(
        <p key={i} style={{fontSize:13,color:"#555",margin:"4px 0"}}>{i+1}. {s}</p>
      ))}
      </div>

      <div className="pb" />

      {/* ═══ Architecture ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>1. 系统架构</h2>
      <pre style={{ fontSize: 11, lineHeight: 1.6, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
        {`┌─────────────────────────────────────────┐
│         Next.js Frontend                  │
│  /stock (终端)  /stock/quant (因子研究)    │
│  ECharts · Tailwind · Linear Dark Theme   │
├─────────────────────────────────────────┤
│         Next.js API Routes                │
│  /api/stock-report  /api/trade            │
│  /api/quant  /api/quant/suggest           │
│  /api/trade/analyze                       │
├─────────────────────────────────────────┤
│         Python Quant Engine               │
│  quant/factors.py    (20 factor library)  │
│  quant/backtest.py   (daily backtest)     │
│  quant/factory.py    (AI factor factory)  │
│  quant/clean.py      (factor cleaning)    │
│  quant/operators.py  (17 TS operators)    │
│  quant/optimize.py   (portfolio theory)   │
│  quant/regime.py     (market regime)      │
│  data_engine/        (data fetchers)      │
│  ai_engine/          (AI analysis)        │
├─────────────────────────────────────────┤
│         SQLite Database                   │
│  trade.db (account/positions/trades)      │
├─────────────────────────────────────────┤
│         External Data Sources             │
│  AkShare · East Money API (curl)         │
│  Sina Finance RSS · CLS News             │
│  DeepSeek API (LLM)                       │
└─────────────────────────────────────────┘`}
      </pre>

      {/* ═══ 2. Review ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>2. 市场复盘子系统</h2>
      <p style={{ fontSize: 12 }}><b>数据源:</b> AkShare (指数日线) + East Money curl (板块/资金流) + 东方财富/财联社/新浪财经 (新闻)</p>
      <p style={{ fontSize: 12 }}><b>AI 引擎:</b> DeepSeek API 生成 7 区结构化复盘报告</p>
      <p style={{ fontSize: 12 }}><b>输出内容:</b> 市场情绪(冰点/修复/主升/分歧/退潮) · 主线方向 · 板块分析 · 资金流向 · 新闻联动 · 风险信号 · 明日观察</p>
      <p style={{ fontSize: 12 }}><b>运行方式:</b> 收盘后手动执行 <code>python run_review.py</code>；日内板块/涨停数据通过 curl 从 push2.eastmoney.com 获取</p>

      {/* ═══ 3. Factors ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>3. 因子引擎</h2>
      <p style={{ fontSize: 12 }}><b>经典因子 (20 个):</b> momentum_20/60, volatility_20, ema_cross, vwap_gap, rsi_14, macd_signal, bollinger_pct, atr_ratio, obv_change, turnover_anomaly, price_position, volume_price_trend, skew_20, kurtosis_20, amplitude_ratio, ma_divergence, overnight_gap, volume_climax, up_down_ratio, high_low_ratio</p>
      <p style={{ fontSize: 12 }}><b>时间序列算子 (17 个):</b> rank, scale, ts_mean, ts_std, ts_sum, ts_min, ts_max, ts_rank, ts_argmax, ts_argmin, delta, delay, signed_power, decay_linear, ts_corr, cap, ind_neutralize</p>
      <p style={{ fontSize: 12 }}><b>因子注册表:</b> FACTOR_REGISTRY 字典 — 新增因子只需加一行定义</p>

      {/* ═══ 4. Factory ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>4. AI 因子工厂</h2>
      <p style={{ fontSize: 12 }}><b>生成方式:</b> Pairwise 组合 (×, +, ÷, −) + 算子包装 (delta, ts_rank, ts_mean, decay_linear, rank)</p>
      <p style={{ fontSize: 12 }}><b>筛选标准:</b> |Rank IC| &gt; 0.03 → active, 否则 rejected</p>
      <p style={{ fontSize: 12 }}><b>生命周期:</b> active → deprecated (新一批生成时自动淘汰)</p>
      <p style={{ fontSize: 12 }}><b>历史最佳:</b> alpha_turnover_anomaly_mul_skew_20 (IC=0.135, Sharpe=3.8)</p>

      {/* ═══ 5. Backtest ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>5. 回测系统</h2>
      <p style={{ fontSize: 12 }}><b>频率:</b> 日频</p>
      <p style={{ fontSize: 12 }}><b>方法:</b> 做多因子值最高 30% 的样本，做空最低 30%，计算多空收益</p>
      <p style={{ fontSize: 12 }}><b>评估指标:</b> Total Return, Annual Return, Sharpe, Max Drawdown, Win Rate, Calmar, IC, Rank IC, IR</p>
      <p style={{ fontSize: 12 }}><b>手续费:</b> 0.03% 佣金 + 0.01% 滑点</p>

      {/* ═══ 6. Cleaning ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>6. 因子清洗管线</h2>
      <p style={{ fontSize: 12 }}><b>Pipeline 步骤:</b> 缺失值填充 (ffill) → MAD 去极值 (5σ) → Winsorize (1%/99%) → ZScore 标准化 → 市值中性化 (可选)</p>
      <p style={{ fontSize: 12 }}><b>清洗效果:</b> volatility_20 IC 从 0.076 → 0.111 (+46%), ema_cross IC 从 -0.023 → +0.016 (方向修正)</p>

      {/* ═══ 7. Portfolio ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>7. 多因子组合</h2>
      <p style={{ fontSize: 12 }}><b>三种组合策略:</b></p>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginTop: 8 }}>
        <thead><tr style={{ background: "#f5f5f5" }}><th style={{ padding: "6px 10px", textAlign: "left", border: "1px solid #ddd" }}>策略</th><th style={{ padding: "6px 10px", border: "1px solid #ddd" }}>Sharpe</th><th style={{ padding: "6px 10px", border: "1px solid #ddd" }}>年化收益</th><th style={{ padding: "6px 10px", border: "1px solid #ddd" }}>最大回撤</th></tr></thead>
        <tbody>
          <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>等权组合</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>0.18</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>3.1%</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>-16.7%</td></tr>
          <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>IC 加权</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>0.37</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>6.3%</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>-24.2%</td></tr>
          <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>Regime 自适应</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>-0.34</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>-5.0%</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "center" }}>-10.8%</td></tr>
        </tbody>
      </table>

      {/* ═══ 8. Regime ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>8. 市场状态识别</h2>
      <p style={{ fontSize: 12 }}><b>方法:</b> 波动率分层 — 20 日波动率在 252 日历史中的百分位</p>
      <p style={{ fontSize: 12 }}><b>状态:</b> 低波震荡 (&lt;80%ile) · 趋势 (abs_ret &gt; 1.5σ) · 高波动 (&gt;80%ile)</p>
      <p style={{ fontSize: 12 }}><b>自适应:</b> 趋势市 → 动量/趋势因子 · 震荡市 → RSI/布林带/反转因子 · 高波市 → 波动/偏度/峰度因子</p>

      {/* ═══ 9. Paper Trading ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>9. 模拟交易系统</h2>
      <p style={{ fontSize: 12 }}><b>初始资金:</b> 1,000,000 元</p>
      <p style={{ fontSize: 12 }}><b>支持操作:</b> 买入/卖出/加仓/减仓/止盈/止损</p>
      <p style={{ fontSize: 12 }}><b>数据存储:</b> SQLite (data/trade.db) — accounts, positions, trades, strategies</p>
      <p style={{ fontSize: 12 }}><b>交易日志:</b> 每笔记录时间/方向/名称/股数/价格/交易逻辑/情绪阶段/所属板块</p>

      {/* ═══ 10. AI Strategy ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>10. AI 策略分析</h2>
      <p style={{ fontSize: 12 }}><b>功能:</b> 回测任一策略 → 点击「AI 分析」→ DeepSeek 分析盈亏模式</p>
      <p style={{ fontSize: 12 }}><b>输出:</b> 整体评价 · 优势 · 弱点 · 盈亏模式 · 改进建议</p>

      {/* ═══ 11. AI Suggest ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>11. AI 量化建议</h2>
      <p style={{ fontSize: 12 }}><b>输入:</b> 当前市场状态 + Top 5 因子 IC + 持仓统计 + 市场总结</p>
      <p style={{ fontSize: 12 }}><b>输出:</b> 状态解读 · 因子指引 · 持仓建议 · 风险提示 · 下一步操作</p>

      {/* ═══ 12. Charts ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>12. K 线图表</h2>
      <p style={{ fontSize: 12 }}><b>三周期切换:</b> 日线 (60 交易日) · 60 分钟 · 分时 (5 分钟)</p>
      <p style={{ fontSize: 12 }}><b>技术指标:</b> MA5 / MA10 / MA20 均线叠加 · 成交量柱</p>
      <p style={{ fontSize: 12 }}><b>数据源:</b> AkShare + curl from push2his.eastmoney.com (5min/60min/daily)</p>

      {/* ═══ 13. Frontend ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>13. 前端终端</h2>
      <p style={{ fontSize: 12 }}><b>设计系统:</b> Linear Dark 设计 token — 背景 #010102, 面板 #0f1011, 边框 #23252a</p>
      <p style={{ fontSize: 12 }}><b>配色:</b> 中国股市惯例 — 红涨绿跌, 利好红色, 利空绿色</p>
      <p style={{ fontSize: 12 }}><b>页面:</b></p>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginTop: 8 }}>
        <thead><tr style={{ background: "#f5f5f5" }}><th style={{ padding: "6px 10px", textAlign: "left", border: "1px solid #ddd" }}>路由</th><th style={{ padding: "6px 10px", textAlign: "left", border: "1px solid #ddd" }}>功能</th></tr></thead>
        <tbody>
          <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>/stock</td><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>AI 复盘终端 + 模拟交易</td></tr>
          <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>/stock/quant</td><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>因子研究 · 工厂 · 策略对比 · AI 建议</td></tr>
        </tbody>
      </table>

      {/* ═══ 14. Tech Stack ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>14. 技术栈</h2>
      <pre style={{ fontSize: 11, lineHeight: 1.8 }}>
        Frontend:   Next.js 16 · React 19 · TailwindCSS · ECharts · TypeScript
        Backend:    Python 3.14 · AkShare · Pandas · NumPy
        Database:   SQLite (trade.db) → 可升级 PostgreSQL
        AI:         DeepSeek API (deepseek-chat) · OpenAI SDK
        Data:       East Money HTTP API (curl) · Sina RSS · CLS API
        Design:     Linear Dark tokens · system-ui · JetBrains Mono
      </pre>

      {/* ═══ 15. Directories ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>15. 项目目录结构</h2>
      <pre style={{ fontSize: 10, lineHeight: 1.6 }}>
d:\stock-review\                    # Python 量化引擎
├── data_engine/      fetch_market.py, fetch_sector.py, fetch_kline.py, fetch_news.py
├── ai_engine/        analyze.py
├── quant/            factors.py, backtest.py, factory.py, clean.py, operators.py, optimize.py, regime.py
├── run_review.py     复盘管道
└── data/             缓存 JSON

d:\pm-resume-analyzer\              # Next.js 终端
├── app/stock/        page.tsx (终端), quant/page.tsx (因子研究)
├── app/api/          stock-report, trade, quant, analytics
├── lib/              trade-db.ts (SQLite)
└── components/       (UI 组件)
      </pre>

      {/* ═══ 16. Quick Start ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>16. 快速开始</h2>
      <pre style={{ fontSize: 11, lineHeight: 1.8, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
# 1. 运行市场复盘
cd d:\stock-review
python run_review.py

# 2. 启动前端终端
cd d:\pm-resume-analyzer
npm run dev

# 3. 访问
复盘终端:     http://localhost:3000/stock
因子研究:     http://localhost:3000/stock/quant

# 4. 运行因子回测
python -c "from quant.backtest import evaluate_all_factors; import json; r=evaluate_all_factors(500); json.dump(r, open('data/factors.json','w'))"

# 5. 运行因子工厂
python -c "from quant.factory import evaluate_and_filter; from quant.backtest import load_data; df=load_data(500); evaluate_and_filter(df, 0.03, 8)"
      </pre>

      {/* ═══ 17. Future ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: "2px solid #222", paddingBottom: 4, marginBottom: 12, marginTop: 30 }}>17. 后续发展方向</h2>
      <p style={{ fontSize: 12, color: "#555" }}><b>Phase 4 — 股票池截面因子 (推荐):</b> 将当前单股票因子扩展到 A 股前 500 只股票，做截面排名选股 — 这是真正产生 alpha 的方向</p>
      <p style={{ fontSize: 12, color: "#555" }}><b>Phase 5 — 分钟级回测:</b> 基于 5 分钟 K 线数据做日内策略回测</p>
      <p style={{ fontSize: 12, color: "#555" }}><b>Phase 6 — WorldQuant Alpha101:</b> 直接引入开源 Alpha101 实现</p>
    </div>
  );
}
