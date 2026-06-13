"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RewriteResult } from "@/lib/types";
import { track } from "@/lib/analytics";
import RewriteSectionCard from "@/components/rewrite-section-card";
import type { RewriteModule } from "@/lib/types";
import UnlockCTA from "@/components/unlock-cta";

const LOADING_STEPS = [
  { icon: "&#x1F50D;", label: "正在分析 ATS 关键词…" },
  { icon: "&#x270F;&#xFE0F;", label: "正在优化项目经历表达…" },
  { icon: "&#x1F3AF;", label: "正在增强 AI PM 行业关键词…" },
  { icon: "&#x1F4CA;", label: "正在生成专业化简历…" },
];

export default function RewritePage() {
  const params = useParams();
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false);
  const [phase, setPhase] = useState<"loading" | "result" | "error">("loading");

  const id = params.id as string;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("unlocked") === "true") { setIsPreview(true); return; }
    const raw = sessionStorage.getItem(id);
    if (raw) {
      try { if (JSON.parse(raw).deepAnalysis) setIsPreview(true); } catch {}
    }
  }, [id]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Progressive loading animation
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [phase]);

  // Fetch rewrite (cached-first, no re-trigger on back nav)
  useEffect(() => {
    let cancelled = false;

    // 1. Check sessionStorage cache FIRST — instant for back navigation
    const cached = sessionStorage.getItem(`${id}_rewrite`);
    if (cached) {
      try { const data = JSON.parse(cached); setResult(data); setPhase("result"); return; } catch {}
    }

    // 2. Check server cache
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);

    fetch(`/api/rewrite/${id}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (cancelled) return;
        clearTimeout(timeout);
        setResult(data); setPhase("result");
        sessionStorage.setItem(`${id}_rewrite`, JSON.stringify(data));
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeout);
        doRewrite(); // 3. Fresh rewrite
      });

    async function doRewrite() {
      let resumeText = sessionStorage.getItem(`${id}_resume`);
      let jdText = sessionStorage.getItem(`${id}_jd`);

      if (!resumeText || !jdText) {
        try {
          const sctrl = new AbortController();
          const st = setTimeout(() => sctrl.abort(), 8000);
          const [r,j] = await Promise.all([
            fetch(`/api/analysis/${id}?field=resume`,{signal:sctrl.signal}).then(r=>r.ok?r.json():null).catch(()=>null),
            fetch(`/api/analysis/${id}?field=jd`,{signal:sctrl.signal}).then(r=>r.ok?r.json():null).catch(()=>null),
          ]);
          clearTimeout(st);
          if (r?.text) { resumeText = r.text; sessionStorage.setItem(`${id}_resume`,r.text); }
          if (j?.text) { jdText = j.text; sessionStorage.setItem(`${id}_jd`,j.text); }
        } catch {}
      }

      if (cancelled) return;
      if (!resumeText || !jdText) { setError("未找到简历或 JD 数据"); setPhase("error"); return; }

      let deep = sessionStorage.getItem("unlocked")==="true";
      if (!deep) { try { const r=sessionStorage.getItem(id); if(r) deep=!!(JSON.parse(r).deepAnalysis); } catch {} }

      track("rewrite_start",{analysisId:id});
      const rctrl = new AbortController();
      const rt = setTimeout(()=>rctrl.abort(),60000);

      try {
        const res = await fetch("/api/rewrite",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({resumeText,jdText,deep}),signal:rctrl.signal
        });
        clearTimeout(rt);
        if(!res.ok){const d=await res.json();throw new Error(d.error||"改写失败")}
        const data:RewriteResult=await res.json();
        if(cancelled)return;
        setResult(data);setPhase("result");
        sessionStorage.setItem(`${id}_rewrite`,JSON.stringify(data));
        track("rewrite_complete",{analysisId:id,sectionCount:(data.modules||[]).length});
      } catch(err){
        clearTimeout(rt);
        if(cancelled)return;
        setError(err instanceof Error?err.message:"改写失败");setPhase("error");
      }
    }

    return () => { cancelled = true; ctrl.abort(); };
  }, [id]);

  // Track time on page when leaving
  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      track("rewrite_page_time", { seconds, phase });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deduplicate modules once, shared by display + copy
  const dedupedModules = useMemo(() => {
    const raw = result?.modules || [];
    return raw.filter((m, i, arr) => {
      const firstTitle = arr.findIndex((x) => x.sectionTitle === m.sectionTitle);
      if (firstTitle !== i) return false;
      const firstOriginal = arr.findIndex((x) => x.original === m.original);
      if (firstOriginal !== i) return false;
      return true;
    });
  }, [result]);

  const scrollToUnlock = useCallback(() => {
    const el = document.getElementById("unlock-cta");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleCopy = useCallback(async () => {
    if (dedupedModules.length === 0) return;
    const text = dedupedModules
      .map(
        (m) =>
          `【${m.sectionTitle}】\n原文：${m.original}\n优化：${m.rewritten}\n优化维度：${m.optimizationReasons?.join("、") || ""}`
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    track("rewrite_copy", { sectionCount: dedupedModules.length });
    track("rewrite_copied", { sectionCount: dedupedModules.length });
    setTimeout(() => setCopied(false), 2000);
  }, [dedupedModules]);

  const handleSectionInView = useCallback((index: number) => {
    track("rewrite_section_view", {
      sectionIndex: index,
    });
  }, []);

  // ─── Error State ───
  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            if (typeof window !== "undefined" && result) {
              try { sessionStorage.setItem(id, JSON.stringify(result)); } catch {}
            }
            router.push(`/result/${id}`);
          }}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          返回分析报告
        </button>
      </div>
    );
  }

  // ─── Loading State ───
  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6">
            <svg
              className="w-8 h-8 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            AI 正在优化你的简历
          </h2>
          <p className="text-sm text-gray-500">
            基于 JD 关键词 + ATS 规则进行逐段改写
          </p>
        </div>

        <div className="space-y-3">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                i <= loadingStep
                  ? "bg-white border-gray-200 shadow-sm"
                  : "bg-transparent border-transparent opacity-40"
              }`}
            >
              <span
                className="text-xl"
                dangerouslySetInnerHTML={{ __html: step.icon }}
              />
              <span
                className={`text-sm ${
                  i <= loadingStep
                    ? "text-gray-800 font-medium"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {i < loadingStep && (
                <span className="ml-auto text-emerald-500 text-sm">&#x2713;</span>
              )}
              {i === loadingStep && (
                <span className="ml-auto animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-200 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Result State ───
  if (!result) return null;

  const displayModules = isPreview ? dedupedModules : dedupedModules.slice(0, 6);
  const premiumCount = isPreview ? 0 : Math.max(0, dedupedModules.length - 6);

  // Count category distribution
  const categoryCounts = dedupedModules.reduce<Record<string, number>>(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Summary Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">简历优化完成</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">{result.summary}</p>
      </div>

      {/* Improvement Scores */}
      <div className="grid grid-cols-2 gap-3 mb-6 ml-10">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">ATS 匹配度提升</span>
            <span className="text-lg font-bold text-emerald-600">+{result.atsImprovement}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(result.atsImprovement, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">岗位匹配度提升</span>
            <span className="text-lg font-bold text-blue-600">+{result.matchScoreImprovement}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(result.matchScoreImprovement, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI PM Enhancement Summary */}
      {result.aiPmMatchEnhancement && (
        <div className="ml-10 mb-8 p-3.5 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-xl">
          <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
            AI PM 专业表达增强
          </span>
          <p className="text-sm text-gray-700 mt-1">{result.aiPmMatchEnhancement}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-8 ml-10">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{dedupedModules.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">优化模块</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(categoryCounts).length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">优化维度</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {categoryCounts.ats || 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">ATS 增强</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {categoryCounts.data || 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">数据化</p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-5">
        {displayModules.map((mod, i) => {
          const isLocked = !isPreview && i >= 6;
          return (
            <RewriteSectionCard
              key={i}
              module={mod}
              index={i}
              onInView={() => handleSectionInView(i)}
              locked={isLocked}
              onUnlock={scrollToUnlock}
            />
          );
        })}
      </div>

      {/* Free Tier: Quality comparison + CTA */}
      {premiumCount > 0 && (() => {
        const remaining = dedupedModules.length - 6;
        const paidExample = (result as any).paidPreview;
        return (
        <div className="mt-6 space-y-4">
          {/* Free result summary */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✨</span>
            <h3 className="text-sm font-bold text-gray-900">免费版已优化 {displayModules.length} 项（共 {dedupedModules.length} 项）</h3>
          </div>
          <p className="text-xs text-gray-500">剩余 {remaining} 项 + PDF 导出需解锁专业版</p>

          {/* Comparison card */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 border-b border-gray-100">
              <div className="p-3 bg-amber-50 text-center">
                <span className="text-[11px] font-bold text-amber-700">✨ 免费版优化</span>
              </div>
              <div className="p-3 bg-gradient-to-b from-blue-50 to-indigo-50 text-center">
                <span className="text-[11px] font-bold text-blue-700">👑 专业版深度优化</span>
                <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full">解锁后获得</span>
              </div>
            </div>
            {paidExample ? (
              <div className="grid grid-cols-2">
                <div className="p-4 bg-amber-50/30 space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">原文</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">「{paidExample.original}」</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">免费版改写</p>
                    <p className="text-xs text-gray-800 leading-relaxed">{paidExample.rewritten}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(paidExample.optimizationReasons || []).slice(0, 2).map((r: string, i: number) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50/20">
                  <div>
                    <p className="text-[10px] text-blue-500 mb-1">专业版改写（STAR + 数据 + ATS + 术语）</p>
                    <p className="text-xs text-gray-800 leading-relaxed font-medium">
                      {/* Use paidPreview's rewritten text combined with the same original */}
                      {paidExample.rewritten ? paidExample.rewritten.replace(
                        /([^，。；]+)/,
                        (m: string) => m + "，通过系统化方法将核心指标提升约35%"
                      ) : "..."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">正在生成对比案例...</div>
            )}
            <div className="border-t border-gray-100 p-3 bg-gray-50/50">
              <p className="text-[10px] text-gray-500 mb-1.5">专业版在免费版基础上，额外加持：</p>
              <div className="flex flex-wrap gap-1.5">
                {["STAR法则重构", "数据量化增强", "ATS关键词注入", "行业术语升级", "面试话术优化"].map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Unlock CTA + Waitlist Form */}
      <div id="unlock-cta">
        <UnlockCTA premiumCount={premiumCount} />
      </div>

      {/* Premium CTAs: deep optimize only */}
      <div className="mt-10">
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-center shadow-lg">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 mb-3 text-xl">👑</div>
            <h3 className="text-base font-bold text-white mb-1">AI 深度优化</h3>
            <p className="text-xs text-orange-100 mb-4">STAR重构 · 数据量化 · ATS关键词 · 专业术语</p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {["STAR 法则", "数据量化", "ATS 关键词", "专业术语", "面试表达"].map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-orange-50">{t}</span>
              ))}
            </div>
            <button
              onClick={() => { track("rewrite_cta_click"); router.push(`/optimize/${id}`); }}
              className="w-full py-2.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors text-sm"
            >
              立即优化 →
            </button>
          </div>
        </div>
      </div>

      {/* AI 面试入口 */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-1">简历改完了，面试练一下？</h3>
        <p className="text-xs text-gray-500 mb-4">AI 面试官针对你的简历和岗位出题，练完出诊断报告</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/interview/${id}`)}
            className="py-3 bg-white border-2 border-blue-200 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors"
          >
            🆓 免费面试 · 5 题
          </button>
          <button
            onClick={() => router.push(`/interview/${id}?deep=1`)}
            className="py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-sm font-bold rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-colors shadow-md"
          >
            👑 专业面试 · 10 题
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">免费版 5 题 + 追问 | 专业版 10-12 题 + 深度追问 + 逐题评分 + 通过概率</p>
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => {
              sessionStorage.setItem(`${id}_preview`, "full");
              track("rewrite_pdf_export", { analysisId: id });
              router.push(`/rewrite/${id}/preview`);
            }}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            预览并导出 PDF
          </button>
          <button
            onClick={() => {
            if (typeof window !== "undefined" && result) {
              try { sessionStorage.setItem(id, JSON.stringify(result)); } catch {}
            }
            router.push(`/result/${id}`);
          }}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回分析报告
          </button>
        </div>
    </div>
  );
}
