"use client";

import { useEffect, useState } from "react";

interface FactorResult {
  name: string; desc: string; category: string;
  sharpe: number; annual_return: number; max_drawdown: number;
  win_rate: number; calmar: number; ic: number; rank_ic: number; ir: number;
  total_return: number;
}

const CAT_COLORS: Record<string, string> = {
  "动量": "#f85149", "波动": "#d29922", "趋势": "#5e6ad2", "量价": "#27a644",
  "反转": "#3fb950", "统计": "#8a8f98",
};

function sharpeColor(s: number) {
  if (s >= 2) return "text-[#f85149]"; if (s >= 1) return "text-[#d29922]";
  if (s >= 0) return "text-[#8a8f98]"; return "text-[#27a644]";
}

export default function QuantPage() {
  const [factors, setFactors] = useState<FactorResult[]>([]);
  const [factoryPool, setFactoryPool] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("sharpe");
  const [running, setRunning] = useState(false);

  const fetchFactors = async () => {
    const [fr, pr, sr, fp] = await Promise.all([
      fetch("/api/quant"), fetch("/api/quant?action=portfolio"), fetch("/api/quant/suggest"), fetch("/api/quant?action=factory")
    ]);
    if (fr.ok) setFactors(await fr.json());
    if (pr.ok) setPortfolio(await pr.json());
    if (sr.ok) setSuggestion(await sr.json());
    if (fp.ok) setFactoryPool(await fp.json());
    setLoading(false);
  };

  useEffect(() => { fetchFactors(); }, []);

  const rerun = async () => {
    setRunning(true);
    const r = await fetch("/api/quant", { method: "POST" });
    if (r.ok) setFactors(await r.json());
    setRunning(false);
  };

  const sorted = [...factors].sort((a, b) => {
    const ka = a[sortKey as keyof FactorResult] || 0;
    const kb = b[sortKey as keyof FactorResult] || 0;
    return Number(kb) - Number(ka);
  });

  // Category summary
  const byCat: Record<string, { count: number; avgSharpe: number }> = {};
  for (const f of factors) {
    if (!byCat[f.category]) byCat[f.category] = { count: 0, avgSharpe: 0 };
    byCat[f.category].count++;
    byCat[f.category].avgSharpe += f.sharpe || 0;
  }
  for (const c of Object.keys(byCat)) byCat[c].avgSharpe /= byCat[c].count || 1;

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center"><p className="text-[#8a8f98] text-sm">Loading factors...</p></div>;

  return (
    <div className="min-h-screen bg-[#010102] text-[#d0d6e0] font-sans">
      <div className="max-w-[1440px] mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0f1011] border border-[#23252a] rounded-xl px-5 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[#f7f8f8]">Factor Research</span>
            <span className="text-xs text-[#8a8f98]">{factors.length} factors evaluated</span>
            <a href="/stock" className="text-xs text-[#5e6ad2]">← Terminal</a>
          </div>
          <div className="flex items-center gap-4">
            <select className="bg-[#141516] border border-[#23252a] rounded-md px-2 py-1 text-xs text-[#d0d6e0]"
              value={sortKey} onChange={e => setSortKey(e.target.value)}>
              <option value="sharpe">Sort: Sharpe</option>
              <option value="annual_return">Sort: Annual Return</option>
              <option value="rank_ic">Sort: Rank IC</option>
              <option value="calmar">Sort: Calmar</option>
              <option value="win_rate">Sort: Win Rate</option>
            </select>
            <button className="px-3 py-1 bg-[#5e6ad2] text-white text-xs rounded-md hover:bg-[#828fff]"
              onClick={rerun} disabled={running}>{running ? "Running..." : "Rerun Backtest"}</button>
          </div>
        </div>

        {/* Strategy Comparison */}
        {portfolio && (
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">STRATEGY COMPARISON (Top 10 factors, 500d)</p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {["equal_weight","ic_weighted","dynamic","regime_adaptive","benchmark"].map(key => {
                const m = portfolio[key] || {};
                return (
                  <div key={key} className="bg-[#141516] rounded-lg p-2">
                    <p className="text-[10px] text-[#8a8f98] mb-1">{key==="equal_weight"?"等权":key==="ic_weighted"?"IC加权":key==="dynamic"?"动态":"自适应"}</p>
                    <p className={`font-bold ${(m.sharpe||0)>=0.5?"text-[#f85149]":(m.sharpe||0)>0?"text-[#d29922]":"text-[#8a8f98]"}`}>Sharpe {m.sharpe?.toFixed(2)}</p>
                    <p className="text-[10px] text-[#8a8f98]">年化 {m.annual_return?.toFixed(1)}%</p>
                    <p className="text-[10px] text-[#27a644]">回撤 {m.max_drawdown?.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regime + AI Suggestion */}
        <div className="grid grid-cols-2 gap-3">
          {suggestion && (
            <div className="bg-[#0f1011] border border-[#5e6ad2]/30 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#5e6ad2] tracking-wider mb-2">AI QUANT SUGGESTION</p>
              <p className="text-xs text-[#d0d6e0] leading-relaxed mb-2">{suggestion.regime_summary}</p>
              <p className="text-xs text-[#d0d6e0] leading-relaxed mb-2">{suggestion.factor_guidance}</p>
              <p className="text-xs text-[#d0d6e0] leading-relaxed mb-2">{suggestion.position_advice}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#23252a]">
                <p className="text-[10px] text-[#27a644]">{suggestion.risk_alert}</p>
                <span className="px-2 py-0.5 bg-[#5e6ad2]/20 text-[#5e6ad2] text-[10px] font-semibold rounded">{suggestion.next_action}</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Summary */}
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(byCat).map(([cat, d]) => (
            <div key={cat} className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: CAT_COLORS[cat] || "#8a8f98" }}/>
              <p className="text-xs text-[#f7f8f8] font-medium">{cat}</p>
              <p className="text-[10px] text-[#8a8f98]">{d.count} factors · Sharpe {d.avgSharpe.toFixed(1)}</p>
            </div>
          ))}
        </div>

        {/* Factory Section */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider">FACTOR FACTORY</p>
            <button className="px-3 py-1 bg-[#5e6ad2] text-white text-[10px] rounded-md hover:bg-[#828fff]"
              onClick={async () => {
                const r = await fetch("/api/quant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "factory" }) });
                if (r.ok) { await fetchFactors(); }
              }}>
              Generate New Factors
            </button>
          </div>
          <p className="text-[10px] text-[#8a8f98]">
            自动组合基础因子 → 回测 → IC筛选 → 保留高IC因子。当前使用 pairwise 组合 (×, +, ÷, −)。
          </p>
        </div>

        {/* Factor Table */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_70px_70px_70px_70px_70px_70px] gap-2 px-4 py-2 text-[10px] text-[#8a8f98] font-semibold bg-[#141516]">
            <span>Factor</span>
            <span className="text-right">Sharpe</span>
            <span className="text-right">Ann.Ret%</span>
            <span className="text-right">MaxDD%</span>
            <span className="text-right">Win%</span>
            <span className="text-right">Calmar</span>
            <span className="text-right">Rank IC</span>
            <span className="text-right">IR</span>
          </div>
          {sorted.map((f, i) => (
            <div key={f.name} className="grid grid-cols-[1fr_80px_70px_70px_70px_70px_70px_70px] gap-2 px-4 py-2 text-xs border-t border-[#1a1a2e] hover:bg-[#141516] transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLORS[f.category] || "#8a8f98" }}/>
                <span className="text-[#d0d6e0] font-medium">{f.name}</span>
                <span className="text-[10px] text-[#8a8f98]">{f.desc}</span>
              </div>
              <span className={`text-right font-semibold ${sharpeColor(f.sharpe)}`}>{f.sharpe?.toFixed(2)}</span>
              <span className={`text-right ${(f.annual_return || 0) >= 0 ? "text-[#f85149]" : "text-[#27a644]"}`}>{f.annual_return?.toFixed(1)}</span>
              <span className="text-right text-[#27a644]">{f.max_drawdown?.toFixed(1)}</span>
              <span className="text-right text-[#8a8f98]">{f.win_rate?.toFixed(0)}</span>
              <span className="text-right text-[#8a8f98]">{f.calmar?.toFixed(2)}</span>
              <span className={`text-right font-semibold ${(f.rank_ic || 0) > 0.03 ? "text-[#f85149]" : "text-[#8a8f98]"}`}>{f.rank_ic?.toFixed(4)}</span>
              <span className={`text-right ${(f.ir || 0) > 0.5 ? "text-[#f85149]" : "text-[#8a8f98]"}`}>{f.ir?.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* Factory Results */}
        {factoryPool.filter((f: any) => f.status === "active" || f.status === "promoted").length > 0 && (
          <div className="bg-[#0f1011] border border-[#5e6ad2]/30 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#5e6ad2] tracking-wider mb-2">
              FACTORY FACTORS ({factoryPool.filter((f: any) => f.status === "active" || f.status === "promoted").length} active)
            </p>
            <div className="grid grid-cols-[1fr_80px_70px_70px_70px] gap-2 text-[10px] text-[#8a8f98] mb-1">
              <span>Expression</span><span className="text-right">Sharpe</span><span className="text-right">Rank IC</span><span className="text-right">Ann.Ret%</span><span className="text-right">MaxDD%</span>
            </div>
            {factoryPool.filter((f: any) => f.status === "active" || f.status === "promoted").slice(0, 5).map((f: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_80px_70px_70px_70px] gap-2 py-1 text-xs border-t border-[#1a1a2e]">
                <span className="text-[#d0d6e0] font-mono text-[10px] truncate">{f.expression || f.name}</span>
                <span className={`text-right font-semibold ${(f.sharpe || 0) >= 2 ? "text-[#f85149]" : "text-[#d29922]"}`}>{f.sharpe?.toFixed(1)}</span>
                <span className="text-right text-[#f85149]">{(f.rank_ic || 0).toFixed(4)}</span>
                <span className="text-right text-[#f85149]">{f.annual_return?.toFixed(1)}</span>
                <span className="text-right text-[#27a644]">{f.max_drawdown?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rankings */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {["sharpe", "rank_ic", "calmar"].map(key => {
            const top5 = sorted.filter(f => f[key as keyof FactorResult] != null).slice(0, 5);
            return (
              <div key={key} className="bg-[#0f1011] border border-[#23252a] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[#8a8f98] tracking-wider mb-2">TOP 5 BY {key.toUpperCase()}</p>
                {top5.map((f, i) => (
                  <div key={i} className="flex justify-between py-1 border-t border-[#1a1a2e]">
                    <span className="text-[#d0d6e0]">{f.name}</span>
                    <span className="font-medium text-[#f85149]">{String(f[key as keyof FactorResult])}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
