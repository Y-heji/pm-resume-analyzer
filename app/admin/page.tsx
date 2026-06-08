"use client";

import { useCallback, useEffect, useState } from "react";
import type { WaitlistEntry } from "@/lib/types";

interface AnalyticsSummary {
  total: number; pageViews: number; totalWaitlist: number;
  totalAnalysis: number; totalRewrite: number; totalPdfExport: number;
  totalWordExport: number; learningClicks: number; jobClicks: number;
  avgDuration: number; recent: Array<{ event: string; time: number }>;
}

export default function AdminPage() {
  const [key, setKey] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("key") || "";
    }
    return "";
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"waitlist" | "codes">("waitlist");

  // ── Code management state ──
  const [paidCodes, setPaidCodes] = useState<any[]>([]);
  const [guestCodes, setGuestCodes] = useState<any[]>([]);
  const [genCount, setGenCount] = useState(1);
  const [genResume, setGenResume] = useState(3);
  const [genInterview, setGenInterview] = useState(3);
  const [genPrefix, setGenPrefix] = useState("PM");
  const [genTag, setGenTag] = useState("job");
  const [guestGenCount, setGuestGenCount] = useState(5);
  const [guestGenResume, setGuestGenResume] = useState(1);
  const [guestGenInt, setGuestGenInt] = useState(1);
  const [guestGenPrefix, setGuestGenPrefix] = useState("TRY");
  const [generated, setGenerated] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  const codeHeaders = { "Content-Type": "application/json", "x-admin-key": key };

  async function loadCodes() {
    const [pRes, gRes] = await Promise.all([
      fetch("/api/admin/codes/list", { headers: codeHeaders }),
      fetch("/api/admin/codes/list-guest", { headers: codeHeaders }),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setPaidCodes(d.codes || []); }
    if (gRes.ok) { const d = await gRes.json(); setGuestCodes(d.codes || []); }
  }

  async function genPaid() {
    setGenLoading(true);
    const res = await fetch("/api/admin/codes/generate", {
      method: "POST", headers: codeHeaders,
      body: JSON.stringify({ count: genCount, resumeOptimize: genResume, mockInterview: genInterview, prefix: genPrefix, tag: genTag }),
    });
    if (res.ok) { const d = await res.json(); setGenerated(d.codes || []); loadCodes(); }
    setGenLoading(false);
  }

  async function deleteCodes(codes: string[]) {
    await fetch("/api/admin/codes/delete", {
      method: "POST", headers: codeHeaders,
      body: JSON.stringify({ codes }),
    });
    loadCodes();
  }
  async function genGuest() {
    setGenLoading(true);
    const res = await fetch("/api/admin/codes/generate-guest", {
      method: "POST", headers: codeHeaders,
      body: JSON.stringify({ count: guestGenCount, resumeOptimize: guestGenResume, paidInterviews: guestGenInt, prefix: guestGenPrefix }),
    });
    if (res.ok) { const d = await res.json(); setGenerated(d.codes || []); loadCodes(); }
    setGenLoading(false);
  }

  const fetchEntries = useCallback(async (authKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/waitlist?key=${encodeURIComponent(authKey)}`);
      if (res.status === 401) {
        setError("Key 不正确");
        return;
      }
      if (!res.ok) throw new Error("请求失败");
      const data = await res.json();
      setEntries(data);
      setAuthenticated(true);
      sessionStorage.setItem("admin_key", authKey);

      // Also fetch analytics
      fetch(`/api/analytics?key=${encodeURIComponent(authKey)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setAnalytics(d); })
        .catch(() => {});
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-login when URL provides key
  useEffect(() => {
    if (key && !authenticated) {
      fetchEntries(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const handleLogin = () => {
    if (!key.trim()) return;
    fetchEntries(key.trim());
  };

  const total = entries.length;
  const byDirection = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.jobDirection] = (acc[e.jobDirection] || 0) + 1;
    return acc;
  }, {});
  const byStatus = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.jobStatus] = (acc[e.jobStatus] || 0) + 1;
    return acc;
  }, {});

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <h1 className="text-xl font-bold mb-6 text-center">
          预约管理
        </h1>
        <div className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="输入 Admin Key"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!key.trim() || loading}
            className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-30 transition-colors text-sm"
          >
            {loading ? "验证中..." : "进入"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">管理后台</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => { setTab("waitlist"); }} className={`px-3 py-1 text-xs rounded-md ${tab==="waitlist"?"bg-white shadow text-gray-900":"text-gray-500"}`}>预约列表</button>
          <button onClick={() => { setTab("codes"); loadCodes(); }} className={`px-3 py-1 text-xs rounded-md ${tab==="codes"?"bg-white shadow text-gray-900":"text-gray-500"}`}>兑换码</button>
        </div>
        <button
          onClick={() => fetchEntries(key)}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
        >
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {tab === "waitlist" ? (<>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-1">总预约数</p>
        </div>
        {Object.entries(byDirection)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([d, c]) => (
            <div key={d} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{c}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{d}</p>
            </div>
          ))}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{byStatus["在职看机会"] || 0}</p>
          <p className="text-xs text-gray-400 mt-1">在职看机会</p>
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">求职方向分布</h3>
          <div className="space-y-2">
            {Object.entries(byDirection)
              .sort(([, a], [, b]) => b - a)
              .map(([d, c]) => (
                <div key={d} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{d}</span>
                  <span className="font-medium text-gray-900">{c}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">求职状态分布</h3>
          <div className="space-y-2">
            {Object.entries(byStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([s, c]) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{s}</span>
                  <span className="font-medium text-gray-900">{c}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                  邮箱
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                  求职方向
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                  求职状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                  提交时间
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {total - i}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {e.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.jobDirection}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {e.jobStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(e.createdAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Analytics Summary ── */}
      {analytics && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">行为数据</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.pageViews}</p>
              <p className="text-[11px] text-gray-400">页面浏览</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.totalAnalysis}</p>
              <p className="text-[11px] text-gray-400">完成分析</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.totalRewrite}</p>
              <p className="text-[11px] text-gray-400">AI 改写</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.learningClicks}</p>
              <p className="text-[11px] text-gray-400">学习路径点击</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.jobClicks}</p>
              <p className="text-[11px] text-gray-400">岗位推荐点击</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.totalPdfExport}</p>
              <p className="text-[11px] text-gray-400">PDF 导出</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.totalWordExport}</p>
              <p className="text-[11px] text-gray-400">Word 导出</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.avgDuration}s</p>
              <p className="text-[11px] text-gray-400">平均停留</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xl font-bold text-gray-900">{analytics.total}</p>
              <p className="text-[11px] text-gray-400">总事件</p>
            </div>
          </div>
        </div>
      )}
      </> ) : (
      /* ═══ Codes Tab ═══ */
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold">兑换码管理</h2>
          <button onClick={loadCodes} className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">🔄 刷新</button>
        </div>
        {/* Generate Paid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold mb-4">生成付费码</h2>
          <div className="grid grid-cols-6 gap-3 mb-4">
            <div><label className="text-[10px] text-gray-500">套餐</label>
              <select value={genTag} onChange={e => { setGenTag(e.target.value); if(e.target.value==="offer"){ setGenResume(10); setGenInterview(10); setGenPrefix("OFFER"); } else { setGenResume(3); setGenInterview(3); setGenPrefix("PM"); } }} className="w-full px-2 py-1.5 border rounded-lg text-xs">
                <option value="job">求职包 ¥29.9</option>
                <option value="offer">拿offer包 ¥49.9</option>
              </select>
            </div>
            <div><label className="text-[10px] text-gray-500">数量</label><input type="number" value={genCount} onChange={e => setGenCount(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">优化次数</label><input type="number" value={genResume} onChange={e => setGenResume(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">面试次数</label><input type="number" value={genInterview} onChange={e => setGenInterview(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">前缀</label><input value={genPrefix} onChange={e => setGenPrefix(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div className="flex items-end"><button onClick={genPaid} disabled={genLoading} className="w-full py-1.5 bg-amber-500 text-white text-xs rounded-lg">生成</button></div>
          </div>
          {generated.length > 0 && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500 mb-1">生成结果（点击复制）：</p>{generated.map((c,i) => <button key={i} onClick={()=>navigator.clipboard.writeText(c)} className="text-xs bg-white px-1.5 py-0.5 rounded mr-1 mb-1 hover:bg-blue-50 hover:text-blue-600" title="点击复制">{c} 📋</button>)}</div>}
        </div>

        {/* Generate Guest */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold mb-4">生成体验码</h2>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div><label className="text-[10px] text-gray-500">数量</label><input type="number" value={guestGenCount} onChange={e => setGuestGenCount(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">优化次数</label><input type="number" value={guestGenResume} onChange={e => setGuestGenResume(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">面试次数</label><input type="number" value={guestGenInt} onChange={e => setGuestGenInt(+e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div><label className="text-[10px] text-gray-500">前缀</label><input value={guestGenPrefix} onChange={e => setGuestGenPrefix(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
            <div className="flex items-end"><button onClick={genGuest} disabled={genLoading} className="w-full py-1.5 bg-blue-500 text-white text-xs rounded-lg">生成</button></div>
          </div>
        </div>

        {/* Inventory */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold mb-3">付费码  <span className="text-xs text-gray-400">({paidCodes.filter(c=>!c.used).length}可用/{paidCodes.length})</span></h2>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {paidCodes.map((c,i) => {
                const tierBadge = c.tag === "offer" ? "🚀" : c.tag === "job" ? "🎯" : "";
                return (
                <div key={i} className={`flex justify-between p-2 rounded-lg text-xs ${c.used?'bg-gray-50 text-gray-400':'bg-amber-50'}`}>
                  <button onClick={()=>navigator.clipboard.writeText(c.code)} className="font-mono hover:text-blue-600" title="点击复制">{c.code}</button>
                  <span className="flex items-center gap-2">
                    {tierBadge && <span className="text-[10px]">{tierBadge}</span>}
                    <span>{c.used?(c.used_by?'已用:'+c.used_by:'已用'):(c.resume_optimize||0)+'优/'+(c.mock_interview||0)+'面'}</span>
                    <button onClick={(e)=>{e.stopPropagation();deleteCodes([c.code]);}} className="text-gray-400 hover:text-red-500 text-xs" title="删除">✕</button>
                  </span>
                </div>)})}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold mb-3">体验码  <span className="text-xs text-gray-400">({guestCodes.filter(c=>!c.used).length}可用/{guestCodes.length})</span></h2>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {guestCodes.map((c,i) => (
                <div key={i} className={`flex justify-between p-2 rounded-lg text-xs ${c.used?'bg-gray-50 text-gray-400':'bg-blue-50'}`}>
                  <button onClick={()=>navigator.clipboard.writeText(c.code)} className="font-mono hover:text-blue-600" title="点击复制">{c.code}</button>
                  <span className="flex items-center gap-2">
                    <span>{c.used?'已用':(c.resume_optimize||0)+'优/'+(c.paid_interviews||0)+'面'}</span>
                    <button onClick={(e)=>{e.stopPropagation();deleteCodes([c.code]);}} className="text-gray-400 hover:text-red-500 text-xs" title="删除">✕</button>
                  </span>
                </div>))}
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
