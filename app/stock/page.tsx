"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

interface ReportData {
  date: string;
  analysis: {
    market_emotion: { stage: string; score: number; summary: string };
    main_lines: string[];
    news_impact?: {
      key_news: Array<{ title: string; impact_sectors: string[]; sentiment: string; logic: string }>;
      hotspot_logic: string;
    };
    sector_analysis: string;
    fund_flow_analysis: string;
    full_summary: string;
    risk_signals: string[];
    tomorrow_watch: string[];
  };
  market: {
    index: { sh: { close: number; pct: number }; ch_next: { close: number; pct: number } };
    breadth: { up: number; down: number; limit_up: number; limit_down: number; total_vol_yi: number };
    north_flow: { net_flow: number };
  };
  kline?: Array<{ date: string; open: number; close: number; high: number; low: number; vol: number }>;
  kline60m?: Array<{ date: string; open: number; close: number; high: number; low: number; vol: number }>;
  kline5m?: Array<{ date: string; open: number; close: number; high: number; low: number; vol: number }>;
  sector: { sectors: Array<{ name: string; pct: number }>; limit_up: Array<{ name: string; pct: number; board?: number; vol_yi?: number }>; fund_flow?: Array<{ name: string; flow: number; pct: number }>; leaders?: Array<{ name: string; code: string; pct: number; board: number; vol_yi: number; type: string }> };
}

async function load(): Promise<ReportData | null> {
  try { const r = await fetch("/api/stock-report"); return r.ok ? r.json() : null; } catch { return null; }
}

function pctC(n: number) { return n > 0 ? "text-[#f85149]" : n < 0 ? "text-[#27a644]" : "text-[#8a8f98]"; }
function pct(n: number) { return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`; }

function fundFlowOption(data: Array<{ name: string; flow: number }>) {
  if (!data?.length) return {};
  const names = data.map(d => d.name).reverse();
  const flows = data.map(d => d.flow).reverse();
  return {
    backgroundColor: "transparent",
    grid: { left: "20%", right: "8%", top: 5, bottom: 5 },
    xAxis: { type: "value", axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { color: "#8a8f98", fontSize: 9 }, splitLine: { lineStyle: { color: "#1a1a2e" } } },
    yAxis: { type: "category", data: names, axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { color: "#d0d6e0", fontSize: 9, width: 60, overflow: "truncate" } },
    series: [{ type: "bar", data: flows, itemStyle: { color: (p: any) => p.value >= 0 ? "#f85149" : "#27a644" }, barWidth: 14 }],
    tooltip: { trigger: "axis", backgroundColor: "#0f1011", borderColor: "#23252a", textStyle: { color: "#d0d6e0", fontSize: 11 },
      formatter: (p: any) => `${p[0].name}<br/>净流入: ${p[0].value.toFixed(1)}亿` },
  };
}

function klineOption(data: ReportData["kline"]) {
  if (!data?.length) return {};
  const dates = data.map(d => d.date);
  const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);
  const vols = data.map(d => d.vol);
  const ma5: (number | null)[] = [], ma10: (number | null)[] = [], ma20: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    ma5.push(i >= 4 ? data.slice(i - 4, i + 1).reduce((s, d) => s + d.close, 0) / 5 : null);
    ma10.push(i >= 9 ? data.slice(i - 9, i + 1).reduce((s, d) => s + d.close, 0) / 10 : null);
    ma20.push(i >= 19 ? data.slice(i - 19, i + 1).reduce((s, d) => s + d.close, 0) / 20 : null);
  }

  return {
    backgroundColor: "transparent",
    grid: [{ left: "8%", right: "8%", top: "10%", height: "55%" }, { left: "8%", right: "8%", top: "72%", height: "20%" }],
    xAxis: [{ data: dates, axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { color: "#8a8f98", fontSize: 9, formatter: (v: string) => v.slice(5) } },
      { gridIndex: 1, data: dates, axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { show: false } }],
    yAxis: [{ scale: true, axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { color: "#8a8f98", fontSize: 9 }, splitLine: { lineStyle: { color: "#1a1a2e" } } },
      { gridIndex: 1, axisLine: { lineStyle: { color: "#23252a" } }, axisLabel: { color: "#8a8f98", fontSize: 8 }, splitLine: { show: false } }],
    series: [
      { type: "candlestick", data: ohlc, itemStyle: { color: "#f85149", color0: "#27a644", borderColor: "#f85149", borderColor0: "#27a644" } },
      { type: "line", data: ma5, smooth: true, lineStyle: { color: "#fbbf24", width: 1 }, symbol: "none" },
      { type: "line", data: ma10, smooth: true, lineStyle: { color: "#5e6ad2", width: 1 }, symbol: "none" },
      { type: "line", data: ma20, smooth: true, lineStyle: { color: "#8a8f98", width: 1 }, symbol: "none" },
      { type: "bar", data: vols, xAxisIndex: 1, yAxisIndex: 1, itemStyle: { color: "rgba(94,106,210,0.3)" } },
    ],
    tooltip: { trigger: "axis", axisPointer: { type: "cross" }, backgroundColor: "#0f1011", borderColor: "#23252a", textStyle: { color: "#d0d6e0", fontSize: 11 } },
  };
}

function EmotionCard({ e }: { e: ReportData["analysis"]["market_emotion"] }) {
  const bg = e.stage.includes("主升") ? "rgba(248,81,73,0.08)" : e.stage.includes("退潮") || e.stage.includes("冰点") ? "rgba(39,166,68,0.08)" : "rgba(94,106,210,0.08)";
  const border = e.stage.includes("主升") ? "rgba(248,81,73,0.2)" : e.stage.includes("退潮") || e.stage.includes("冰点") ? "rgba(39,166,68,0.2)" : "rgba(94,106,210,0.2)";
  return (
    <div className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
      <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-1">MARKET EMOTION</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-[#f7f8f8]">{e.stage}</p>
        <p className="text-3xl font-bold text-[#5e6ad2]">{e.score}</p>
      </div>
      <p className="text-[11px] text-[#8a8f98] mt-1 leading-relaxed">{e.summary}</p>
    </div>
  );
}

export default function StockDashboard() {
  const [d, setD] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState<"day" | "m60" | "m5">("day");
  const [activeTab, setActiveTab] = useState<"review" | "quant">("review");
  useEffect(() => { load().then(setD); }, []);

  if (!d) return <div className="min-h-screen bg-[#010102] flex items-center justify-center"><p className="text-[#8a8f98] text-sm">Loading terminal...</p></div>;

  const a = d.analysis, m = d.market;

  return (
    <div className="min-h-screen bg-[#010102] text-[#d0d6e0] font-sans">
      <div className="max-w-[1440px] mx-auto px-4 py-4 space-y-3">

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center justify-between bg-[#0f1011] border border-[#23252a] rounded-xl px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#27a644] animate-pulse"/>
              <span className="text-xs font-semibold text-[#d0d6e0]">LIVE</span>
            </div>
            <span className="text-[#8a8f98] text-xs">{d.date}</span>

            {/* Module Toggle */}
            <div className="flex bg-[#141516] rounded-lg p-0.5 ml-4">
              <button className={`px-3 py-1 text-[11px] rounded font-medium transition-colors ${activeTab === "review" ? "bg-[#5e6ad2] text-white" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}
                onClick={() => setActiveTab("review")}>复盘分析</button>
              <button className={`px-3 py-1 text-[11px] rounded font-medium transition-colors ${activeTab === "quant" ? "bg-[#5e6ad2] text-white" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}
                onClick={() => setActiveTab("quant")}>量化因子</button>
            </div>

            <a href="/" className="text-xs text-[#5e6ad2] hover:text-[#828fff] ml-2">← PM Resume</a>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>上证 <span className="text-[#f7f8f8] font-semibold">{m.index.sh.close.toFixed(0)}</span> <span className={pctC(m.index.sh.pct)}>{pct(m.index.sh.pct)}</span></span>
            <span>创业板 <span className="text-[#f7f8f8] font-semibold">{m.index.ch_next.close.toFixed(0)}</span> <span className={pctC(m.index.ch_next.pct)}>{pct(m.index.ch_next.pct)}</span></span>
          </div>
        </div>

        {/* ═══ QUANT TAB ═══ */}
        {activeTab === "quant" && <QuantEmbed />}

        {/* ═══ REVIEW TAB ═══ */}
        {activeTab === "review" && (
        <div className="space-y-3">

        {/* ═══ ROW 1: 4 Cards ═══ */}
        <div className="grid grid-cols-4 gap-3">
          <EmotionCard e={a.market_emotion} />
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-1">INDEX</p>
            <p className="text-xl font-bold text-[#f7f8f8]">{m.index.sh.close.toFixed(0)}</p>
            <p className={pctC(m.index.sh.pct)}>{pct(m.index.sh.pct)}</p>
            <p className="text-xl font-bold text-[#f7f8f8] mt-2">{m.index.ch_next.close.toFixed(0)}</p>
            <p className={pctC(m.index.ch_next.pct)}>{pct(m.index.ch_next.pct)}</p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-1">VOLUME</p>
            <p className="text-xl font-bold text-[#f7f8f8]">{m.breadth.total_vol_yi > 0 ? `${m.breadth.total_vol_yi.toLocaleString()}亿` : "--"}</p>
            <p className="text-[11px] text-[#8a8f98]">北向 {m.north_flow.net_flow > 0 ? `${(m.north_flow.net_flow/1e8).toFixed(0)}亿` : "--"}</p>
            {m.breadth.up > 0 && <p className="text-[11px] text-[#8a8f98] mt-2">涨 {m.breadth.up} / 跌 {m.breadth.down}</p>}
          </div>
          <div className="bg-[#0f1011] border border-[#5e6ad2]/20 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#5e6ad2] tracking-wider mb-1">AI SUMMARY</p>
            <p className="text-[12px] text-[#d0d6e0] leading-relaxed line-clamp-4">{a.full_summary}</p>
          </div>
        </div>

        {/* ═══ ROW 2: Main Lines ═══ */}
        <div className="flex gap-2 flex-wrap">
          {(a.main_lines || []).map(l => (
            <span key={l} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: "rgba(94,106,210,0.1)", borderColor: "rgba(94,106,210,0.2)", color: "#5e6ad2" }}>{l}</span>
          ))}
        </div>

        {/* ═══ ROW 3: Sector Heatmap + News Impact ═══ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sector Heatmap */}
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-3">SECTOR HEATMAP</p>
            {d.sector.sectors.length > 0 ? d.sector.sectors.slice(0, 8).map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#d0d6e0] w-16 truncate">{s.name}</span>
                <div className="flex-1 h-3 bg-[#141516] rounded">
                  <div className="h-full rounded" style={{ width: `${Math.min(Math.abs(s.pct) * 12, 100)}%`, background: s.pct > 0 ? "rgba(248,81,73,0.3)" : "rgba(39,166,68,0.3)" }}/>
                </div>
                <span className={`text-xs font-semibold w-14 text-right ${pctC(s.pct)}`}>{pct(s.pct)}</span>
              </div>
            )) : <p className="text-xs text-[#8a8f98]">盘后更新</p>}
          </div>

          {/* News Impact */}
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-3">NEWS → IMPACT</p>
            {a.news_impact?.key_news?.length ? a.news_impact.key_news.slice(0, 3).map((n, i) => (
              <div key={i} className="bg-[#141516] rounded-lg p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[#d0d6e0] font-medium truncate flex-1">{n.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${n.sentiment.includes("利好") ? "bg-[#f85149]/10 text-[#f85149]" : n.sentiment.includes("利空") ? "bg-[#27a644]/10 text-[#27a644]" : "bg-[#d29922]/10 text-[#d29922]"}`}>{n.sentiment}</span>
                </div>
                <p className="text-[10px] text-[#8a8f98]">{(n.impact_sectors || []).join(" · ")}</p>
              </div>
            )) : <p className="text-xs text-[#8a8f98]">暂无新闻数据</p>}
            {a.news_impact?.hotspot_logic && (
              <p className="text-[11px] text-[#8a8f98] mt-2 leading-relaxed">{a.news_impact.hotspot_logic}</p>
            )}
          </div>
        </div>

        {/* Fund Flow Chart */}
        {d.sector.fund_flow && d.sector.fund_flow.length > 0 && (
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">SECTOR FUND FLOW (亿)</p>
            <ReactECharts option={fundFlowOption(d.sector.fund_flow)} style={{ height: 260 }} />
          </div>
        )}

        {/* Leading Stocks Table */}
        {d.sector.leaders && d.sector.leaders.length > 0 && (
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">LEADING STOCKS ({d.sector.leaders.length})</p>
            <div className="text-xs">
              <div className="grid grid-cols-[40px_80px_1fr_70px_80px_80px_1fr] gap-2 text-[#8a8f98] mb-1 px-1">
                <span>#</span><span>Code</span><span>Name</span><span className="text-right">±%</span><span className="text-right">Board</span><span className="text-right">Vol(亿)</span><span>Type</span>
              </div>
              {d.sector.leaders.map((s, i) => (
                <div key={s.code} className="grid grid-cols-[40px_80px_1fr_70px_80px_80px_1fr] gap-2 py-1 border-t border-[#1a1a2e] text-[#d0d6e0]">
                  <span className="text-[#8a8f98]">{i + 1}</span>
                  <span className="text-[#5e6ad2]">{s.code}</span>
                  <span className="truncate font-medium">{s.name}</span>
                  <span className={`text-right ${(s.pct || 0) >= 0 ? "text-[#f85149]" : "text-[#27a644]"}`}>{s.pct > 0 ? "+" : ""}{s.pct?.toFixed(1)}%</span>
                  <span className={`text-right ${s.board >= 2 ? "text-[#f85149] font-semibold" : "text-[#8a8f98]"}`}>{s.board >= 2 ? `${s.board}连板` : "首板"}</span>
                  <span className="text-right text-[#8a8f98]">{s.vol_yi?.toFixed(1) || "--"}</span>
                  <span className={`${s.board >= 3 ? "text-[#f85149]" : s.board >= 2 ? "text-[#d29922]" : "text-[#8a8f98]"}`}>{s.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ROW 4: Sector Analysis + Fund Flow ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">SECTOR ANALYSIS</p>
            <p className="text-xs text-[#d0d6e0] leading-relaxed">{a.sector_analysis}</p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">FUND FLOW</p>
            <p className="text-xs text-[#d0d6e0] leading-relaxed">{a.fund_flow_analysis}</p>
          </div>
        </div>

        {/* ═══ ROW 5: K-Line Chart + Risk/Watch ═══ */}
        <div className="grid grid-cols-[1fr_340px] gap-3">
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider">K-LINE 上证</p>
              <div className="flex gap-1 bg-[#141516] rounded-md p-0.5">
                <button className={`px-2.5 py-0.5 text-[10px] rounded font-medium transition-colors ${period === "day" ? "bg-[#5e6ad2] text-white" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}
                  onClick={() => setPeriod("day")}>日线</button>
                <button className={`px-2.5 py-0.5 text-[10px] rounded font-medium transition-colors ${period === "m60" ? "bg-[#5e6ad2] text-white" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}
                  onClick={() => setPeriod("m60")}>60分钟</button>
                <button className={`px-2.5 py-0.5 text-[10px] rounded font-medium transition-colors ${period === "m5" ? "bg-[#5e6ad2] text-white" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}
                  onClick={() => setPeriod("m5")}>分时</button>
              </div>
            </div>
            {period === "day" && d.kline?.length ? (
              <ReactECharts option={klineOption(d.kline)} style={{ height: 320 }} />
            ) : period === "m60" && d.kline60m?.length ? (
              <ReactECharts option={klineOption(d.kline60m)} style={{ height: 320 }} />
            ) : period === "m5" && d.kline5m?.length ? (
              <ReactECharts option={klineOption(d.kline5m)} style={{ height: 320 }} />
            ) : <p className="text-xs text-[#8a8f98] py-20 text-center">暂无K线数据</p>}
          </div>

          <div className="space-y-3">
            <div className="bg-[#0f1011] border border-[#27a644]/20 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#27a644] tracking-wider mb-2">RISK SIGNALS</p>
              {(a.risk_signals || []).map((s, i) => <p key={i} className="text-xs text-[#8a8f98] mb-1">· {s}</p>)}
              {(!a.risk_signals || a.risk_signals.length === 0) && <p className="text-xs text-[#8a8f98]">暂无</p>}
            </div>
            <div className="bg-[#0f1011] border border-[#5e6ad2]/20 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#5e6ad2] tracking-wider mb-2">TOMORROW WATCH</p>
              {(a.tomorrow_watch || []).map((s, i) => <p key={i} className="text-xs text-[#d0d6e0] mb-1">· {s}</p>)}
            </div>
          </div>
        </div>

        </div>
        )}

        {/* ═══ PAPER TRADING ═══ */}
        <TradePanel />

      </div>
    </div>
  );
}

// ─── Paper Trading Panel ───────────────────────────────────────

function TradePanel() {
  const [account, setAccount] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", name: "", action: "buy", shares: 100, price: 0, logic: "", emotion: "", sector: "" });
  const [msg, setMsg] = useState("");

  const fetchAccount = async () => {
    const r = await fetch("/api/trade?action=account");
    if (r.ok) setAccount(await r.json());
  };
  const fetchTrades = async () => {
    const r = await fetch("/api/trade?action=trades");
    if (r.ok) setTrades(await r.json());
  };

  useEffect(() => { fetchAccount(); fetchTrades(); }, []);

  const syncPrices = async () => {
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_prices" }),
    });
    if (r.ok) { setAccount(await r.json()); setMsg("价格已同步"); }
  };

  const [backtestResult, setBacktestResult] = useState<any>(null);

  const runBacktest = async () => {
    // Auto-create default strategy if needed
    let strategies = await fetch("/api/trade?action=strategies").then(r => r.json());
    let sid = (strategies[0] as any)?.id;
    if (!sid) {
      const cr = await fetch("/api/trade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_strategy", name: "全部交易" }),
      });
      strategies = await cr.json();
      sid = (strategies[0] as any)?.id;
    }
    if (!sid) return;
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "backtest", id: sid }),
    });
    if (r.ok) { setBacktestResult(await r.json()); setMsg("回测完成"); }
  };

  const handleOrder = async () => {
    if (!form.code || !form.price || !form.shares) return;
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "order", code: form.code, name: form.name || form.code,
        orderAction: form.action, shares: Number(form.shares), price: Number(form.price),
        logic: form.logic, emotion_stage: form.emotion, sector: form.sector,
      }),
    });
    if (r.ok) { setAccount(await r.json()); fetchTrades(); setMsg("下单成功"); setForm(p => ({ ...p, code: "", name: "", price: 0, logic: "" })); }
    else setMsg((await r.json()).error || "下单失败");
  };

  const totalProfit = account?.total_profit || 0;

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#23252a]"/>
        <span className="text-[10px] font-semibold text-[#8a8f98] tracking-wider">PAPER TRADING</span>
        <div className="flex-1 h-px bg-[#23252a]"/>
      </div>

      {/* Account Overview */}
      {account && (
        <div className="grid grid-cols-6 gap-2">
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">总资产</p>
            <p className="text-lg font-bold text-[#f7f8f8]">{(account.total_assets / 10000).toFixed(1)}<span className="text-xs ml-1 text-[#8a8f98]">万</span></p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">现金</p>
            <p className="text-lg font-bold text-[#f7f8f8]">{(account.cash / 10000).toFixed(1)}<span className="text-xs ml-1 text-[#8a8f98]">万</span></p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">总盈亏</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-[#f85149]" : "text-[#27a644]"}`}>{totalProfit >= 0 ? "+" : ""}{(totalProfit / 10000).toFixed(2)}<span className="text-xs ml-1 text-[#8a8f98]">万</span></p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">收益率</p>
            <p className={`text-lg font-bold ${(account.total_profit_pct || 0) >= 0 ? "text-[#f85149]" : "text-[#27a644]"}`}>{(account.total_profit_pct || 0) >= 0 ? "+" : ""}{(account.total_profit_pct || 0).toFixed(2)}<span className="text-xs ml-1">%</span></p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">持仓数</p>
            <p className="text-lg font-bold text-[#f7f8f8]">{account.position_count}</p>
          </div>
          <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3">
            <p className="text-[10px] text-[#8a8f98]">交易次数</p>
            <p className="text-lg font-bold text-[#f7f8f8]">{trades.length}</p>
          </div>
          <div className="col-span-6 flex gap-2 mt-1">
            <button className="px-3 py-1 bg-[#141516] border border-[#23252a] rounded text-[10px] text-[#8a8f98] hover:text-[#d0d6e0]" onClick={syncPrices}>同步市价</button>
            <button className="px-3 py-1 bg-[#141516] border border-[#23252a] rounded text-[10px] text-[#8a8f98] hover:text-[#d0d6e0]" onClick={runBacktest}>回测交易</button>
          </div>
          {backtestResult && (
            <div className="col-span-6 bg-[#141516] rounded-lg p-3 text-xs grid grid-cols-5 gap-2 text-center border border-[#23252a]">
              <div><span className="text-[#8a8f98]">交易次数</span><p className="text-[#f7f8f8] font-bold">{backtestResult.total_trades}</p></div>
              <div><span className="text-[#8a8f98]">胜率</span><p className={`font-bold ${(backtestResult.win_rate||0)>=50?"text-[#f85149]":"text-[#27a644]"}`}>{backtestResult.win_rate?.toFixed(0)}%</p></div>
              <div><span className="text-[#8a8f98]">最大回撤</span><p className="text-[#27a644] font-bold">{backtestResult.max_drawdown?.toFixed(1)}%</p></div>
              <div><span className="text-[#8a8f98]">盈亏比</span><p className="text-[#f7f8f8] font-bold">{backtestResult.profit_loss_ratio?.toFixed(2)}</p></div>
              <div><span className="text-[#8a8f98]">收益</span><p className={`font-bold ${(backtestResult.total_return||0)>=0?"text-[#f85149]":"text-[#27a644]"}`}>{(backtestResult.total_return||0).toFixed(0)}</p></div>
            </div>
          )}
        </div>
      )}

      {/* Order Form + Positions */}
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        {/* Order Form */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-3">ORDER</p>
          <div className="space-y-2">
            <input className="w-full bg-[#141516] border border-[#23252a] rounded-md px-3 py-1.5 text-xs text-[#d0d6e0] placeholder-[#8a8f98]" placeholder="股票代码 如 000001"
              value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <input className="w-full bg-[#141516] border border-[#23252a] rounded-md px-3 py-1.5 text-xs text-[#d0d6e0] placeholder-[#8a8f98]" placeholder="股票名称"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="flex gap-2">
              <select className="flex-1 bg-[#141516] border border-[#23252a] rounded-md px-2 py-1.5 text-xs text-[#d0d6e0]"
                value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                <option value="buy">买入</option><option value="sell">卖出</option>
                <option value="add">加仓</option><option value="reduce">减仓</option>
                <option value="stop_profit">止盈</option><option value="stop_loss">止损</option>
              </select>
              <input className="w-20 bg-[#141516] border border-[#23252a] rounded-md px-2 py-1.5 text-xs text-[#d0d6e0]" placeholder="股数"
                type="number" value={form.shares} onChange={e => setForm({ ...form, shares: Number(e.target.value) })} />
            </div>
            <input className="w-full bg-[#141516] border border-[#23252a] rounded-md px-3 py-1.5 text-xs text-[#d0d6e0]" placeholder="成交价"
              type="number" step="0.01" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <input className="w-full bg-[#141516] border border-[#23252a] rounded-md px-3 py-1.5 text-xs text-[#d0d6e0]" placeholder="交易逻辑 (必填)"
              value={form.logic} onChange={e => setForm({ ...form, logic: e.target.value })} />
            <div className="flex gap-2">
              <input className="flex-1 bg-[#141516] border border-[#23252a] rounded-md px-2 py-1.5 text-xs text-[#d0d6e0]" placeholder="情绪阶段"
                value={form.emotion} onChange={e => setForm({ ...form, emotion: e.target.value })} />
              <select className="flex-1 bg-[#141516] border border-[#23252a] rounded-md px-2 py-1.5 text-xs text-[#d0d6e0]"
                value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                <option value="">无策略</option>
                <option value="主升追龙头">主升追龙头</option>
                <option value="冰点低吸">冰点低吸</option>
                <option value="板块轮动">板块轮动</option>
                <option value="放量突破">放量突破</option>
                <option value="高位分歧">高位分歧</option>
              </select>
            </div>
            <button className="w-full py-2 bg-[#5e6ad2] text-white text-xs font-medium rounded-md hover:bg-[#828fff] transition-colors"
              onClick={handleOrder}>下单</button>
            {msg && <p className="text-[10px] text-[#8a8f98] text-center">{msg}</p>}
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">
            POSITIONS {account?.positions?.length > 0 ? `(${account.positions.length})` : ""}
          </p>
          {account?.positions?.length > 0 ? (
            <div className="text-xs">
              <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 text-[#8a8f98] mb-1 px-1">
                <span>名称</span><span className="text-right">持仓</span><span className="text-right">成本</span><span className="text-right">现价</span><span className="text-right">盈亏</span>
              </div>
              {account.positions.map((p: any) => {
                const pnl = (p.current_price - p.avg_cost) * p.shares;
                return (
                  <div key={p.code} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 py-1 border-t border-[#1a1a2e] text-[#d0d6e0]">
                    <span className="truncate">{p.name}</span>
                    <span className="text-right">{p.shares}</span>
                    <span className="text-right">{p.avg_cost.toFixed(2)}</span>
                    <span className="text-right">{p.current_price.toFixed(2)}</span>
                    <span className={`text-right ${pnl >= 0 ? "text-[#f85149]" : "text-[#27a644]"}`}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-[#8a8f98] py-4 text-center">暂无持仓</p>}
        </div>
      </div>

      {/* Strategy Panel */}
      <StrategyPanel trades={trades} account={account} />

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">TRADE LOG ({trades.length})</p>
          <div className="text-xs overflow-x-auto">
            <div className="grid grid-cols-[140px_60px_70px_60px_80px_1fr] gap-2 text-[#8a8f98] mb-1 min-w-[600px]">
              <span>时间</span><span>方向</span><span>名称</span><span>股数</span><span>价格</span><span>逻辑</span>
            </div>
            {trades.slice(0, 20).map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-[140px_60px_70px_60px_80px_1fr] gap-2 py-1 border-t border-[#1a1a2e] text-[#d0d6e0] min-w-[600px]">
                <span className="text-[#8a8f98]">{t.created_at?.slice(5, 16)}</span>
                <span className={["buy","add"].includes(t.action) ? "text-[#f85149]" : "text-[#27a644]"}>{t.action}</span>
                <span className="truncate">{t.name}</span>
                <span className="text-right">{t.shares}</span>
                <span className="text-right">{t.price.toFixed(2)}</span>
                <span className="truncate text-[#8a8f98]">{t.logic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quant Embed (compact factor view for /stock tab) ─────────

function QuantEmbed() {
  const [factors, setFactors] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/quant").then(r => r.json()),
      fetch("/api/quant?action=portfolio").then(r => r.json()),
      fetch("/api/quant/suggest").then(r => r.json()),
    ]).then(([f, p, s]) => { setFactors(Array.isArray(f) ? f : []); setPortfolio(p); setSuggestion(s); });
  }, []);

  return (
    <div className="space-y-3">
      {/* AI Suggestion */}
      {suggestion && (
        <div className="bg-[#0f1011] border border-[#5e6ad2]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#5e6ad2] tracking-wider">AI QUANT SUGGESTION</p>
            <span className="px-2 py-0.5 bg-[#5e6ad2]/20 text-[#5e6ad2] text-[10px] font-semibold rounded">{suggestion.next_action}</span>
          </div>
          <p className="text-xs text-[#d0d6e0] leading-relaxed">{suggestion.regime_summary}</p>
          <p className="text-xs text-[#8a8f98] mt-2">{suggestion.position_advice}</p>
        </div>
      )}

      {/* Strategy Comparison */}
      {portfolio && (
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">STRATEGY COMPARISON</p>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {["equal_weight","ic_weighted","dynamic","regime_adaptive","benchmark"].map(key => {
              const m = portfolio[key] || {};
              const label = key==="equal_weight"?"等权":key==="ic_weighted"?"IC加权":key==="dynamic"?"动态":"自适应";
              return (
                <div key={key} className="bg-[#141516] rounded-lg p-2">
                  <p className="text-[10px] text-[#8a8f98]">{label}</p>
                  <p className={`font-bold text-sm ${(m.sharpe||0)>=0.5?"text-[#f85149]":(m.sharpe||0)>0?"text-[#d29922]":"text-[#8a8f98]"}`}>{m.sharpe?.toFixed(2)}</p>
                  <p className="text-[10px] text-[#8a8f98]">{m.annual_return?.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Factor Rankings */}
      <div className="bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-[#141516]">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider">FACTOR RANKINGS</p>
          <a href="/stock/quant" className="text-[10px] text-[#5e6ad2] hover:text-[#828fff]">完整面板 →</a>
        </div>
        <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-1 text-[10px] text-[#8a8f98]">
          <span>Factor</span><span className="text-right">Sharpe</span><span className="text-right">IC</span><span className="text-right">Ret%</span>
        </div>
        {factors.slice(0, 15).map((f: any, i: number) => (
          <div key={i} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-1 text-xs border-t border-[#1a1a2e]">
            <span className="text-[#d0d6e0] truncate">{f.name}</span>
            <span className={`text-right ${(f.sharpe||0)>=1?"text-[#f85149]":"text-[#8a8f98]"}`}>{f.sharpe?.toFixed(1)}</span>
            <span className={`text-right ${Math.abs(f.rank_ic||0)>0.03?"text-[#f85149]":"text-[#8a8f98]"}`}>{f.rank_ic?.toFixed(2)}</span>
            <span className={`text-right ${(f.annual_return||0)>0?"text-[#f85149]":"text-[#27a644]"}`}>{f.annual_return?.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Strategy Panel ────────────────────────────────────────────

function StrategyPanel({ trades, account }: { trades: any[]; account: any }) {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch("/api/trade?action=strategies").then(r => r.json()).then(setStrategies).catch(() => {});
  }, []);

  const create = async () => {
    if (!newName) return;
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_strategy", name: newName }),
    });
    if (r.ok) { setStrategies(await r.json()); setNewName(""); }
  };

  const backtest = async (id: number) => {
    setAiAnalysis(null);
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "backtest", id }),
    });
    if (r.ok) setBacktestResult(await r.json());
  };

  const analyze = async (id: number) => {
    setAnalyzing(true);
    const r = await fetch("/api/trade/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyId: id }),
    });
    if (r.ok) setAiAnalysis(await r.json());
    setAnalyzing(false);
  };

  const remove = async (id: number) => {
    const r = await fetch("/api/trade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_strategy", id }),
    });
    if (r.ok) { setStrategies(await r.json()); setBacktestResult(null); }
  };

  const buyTrades = trades.filter((t: any) => ["buy","add"].includes(t.action));
  const sellTrades = trades.filter((t: any) => !["buy","add"].includes(t.action));
  const wins = sellTrades.filter((t: any) => {
    const b = buyTrades.find((b: any) => b.code === t.code);
    return b && t.price > b.price;
  }).length;
  const totalTrades = sellTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
        <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">STRATEGY STATS</p>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div><p className="text-lg font-bold text-[#f7f8f8]">{totalTrades}</p><p className="text-[10px] text-[#8a8f98]">交易次数</p></div>
          <div><p className="text-lg font-bold text-[#f7f8f8]">{wins}</p><p className="text-[10px] text-[#8a8f98]">盈利次数</p></div>
          <div><p className={`text-lg font-bold ${winRate >= 50 ? "text-[#f85149]" : "text-[#27a644]"}`}>{winRate.toFixed(0)}%</p><p className="text-[10px] text-[#8a8f98]">胜率</p></div>
          <div><p className="text-lg font-bold text-[#f7f8f8]">{buyTrades.length}</p><p className="text-[10px] text-[#8a8f98]">开仓数</p></div>
          <div><p className="text-lg font-bold text-[#f7f8f8]">{account?.positions?.length || 0}</p><p className="text-[10px] text-[#8a8f98]">当前持仓</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">STRATEGIES</p>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 bg-[#141516] border border-[#23252a] rounded-md px-2 py-1.5 text-xs text-[#d0d6e0]" placeholder="策略名称" value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="px-3 py-1.5 bg-[#5e6ad2] text-white text-xs rounded-md hover:bg-[#828fff]" onClick={create}>创建</button>
          </div>
          {strategies.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-t border-[#1a1a2e]">
              <div>
                <span className="text-xs text-[#d0d6e0] font-medium">{s.name}</span>
                <span className="text-[10px] text-[#8a8f98] ml-2">
                  {s.total_trades}笔 | {s.win_rate?.toFixed(0)}% | 回撤{s.max_drawdown?.toFixed(1)}%
                </span>
              </div>
              <div className="flex gap-1">
                <button className="text-[10px] text-[#5e6ad2] hover:text-[#828fff] px-1.5 py-0.5" onClick={() => backtest(s.id)}>回测</button>
                <button className="text-[10px] text-[#f85149] hover:text-red-400 px-1.5 py-0.5" onClick={() => remove(s.id)}>删</button>
              </div>
            </div>
          ))}
          {strategies.length === 0 && <p className="text-xs text-[#8a8f98] py-2">创建策略 → 下单时选择 → 回测验证</p>}
        </div>
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">BACKTEST RESULT</p>
          {backtestResult ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[#8a8f98]">策略</span><span className="text-[#d0d6e0] font-medium">{backtestResult.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8a8f98]">交易次数</span><span className="text-[#f7f8f8]">{backtestResult.total_trades}</span></div>
              <div className="flex justify-between"><span className="text-[#8a8f98]">胜率</span><span className={backtestResult.win_rate >= 50 ? "text-[#f85149]" : "text-[#27a644]"}>{backtestResult.win_rate?.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-[#8a8f98]">最大回撤</span><span className="text-[#27a644]">{backtestResult.max_drawdown?.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-[#8a8f98]">盈亏比</span><span className="text-[#f7f8f8]">{backtestResult.profit_loss_ratio?.toFixed(2)}</span></div>
            </div>
          ) : <p className="text-xs text-[#8a8f98] py-8 text-center">点击策略旁的「回测」查看统计</p>}
          {backtestResult && (
            <button className="w-full py-1.5 mt-2 bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 rounded-md text-[10px] text-[#5e6ad2] hover:bg-[#5e6ad2]/20 transition-colors"
              onClick={() => analyze(backtestResult.id)} disabled={analyzing}>
              {analyzing ? "分析中..." : "AI 分析 — 为什么赚/亏"}
            </button>
          )}
          {aiAnalysis && (
            <div className="mt-3 p-3 bg-[#141516] rounded-lg space-y-2 border-l-2 border-[#5e6ad2]">
              <p className="text-xs text-[#d0d6e0] leading-relaxed">{aiAnalysis.summary}</p>
              {aiAnalysis.strengths?.length > 0 && (
                <div><p className="text-[10px] text-[#f85149] mb-1">优势</p>
                  {aiAnalysis.strengths.map((s: string, i: number) => <p key={i} className="text-[10px] text-[#8a8f98]">+ {s}</p>)}</div>
              )}
              {aiAnalysis.weaknesses?.length > 0 && (
                <div><p className="text-[10px] text-[#27a644] mb-1">弱点</p>
                  {aiAnalysis.weaknesses.map((w: string, i: number) => <p key={i} className="text-[10px] text-[#8a8f98]">- {w}</p>)}</div>
              )}
              {aiAnalysis.pattern && <p className="text-[10px] text-[#8a8f98] leading-relaxed">{aiAnalysis.pattern}</p>}
              {aiAnalysis.suggestions?.length > 0 && (
                <div><p className="text-[10px] text-[#5e6ad2] mb-1">建议</p>
                  {aiAnalysis.suggestions.map((sg: string, i: number) => <p key={i} className="text-[10px] text-[#8a8f98]">→ {sg}</p>)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
