"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RewriteResult } from "@/lib/types";
import RewriteSectionCard from "@/components/rewrite-section-card";
import { track } from "@/lib/analytics";

export default function OptimizePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [phase, setPhase] = useState<"loading" | "result" | "error">("loading");
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resumeText = sessionStorage.getItem(`${id}_resume`);
    const jdText = sessionStorage.getItem(`${id}_jd`);

    if (!resumeText || !jdText) {
      // Try recover from server
      Promise.all([
        fetch(`/api/analysis/${id}?field=resume`).then(r => r.ok ? r.json() : null),
        fetch(`/api/analysis/${id}?field=jd`).then(r => r.ok ? r.json() : null),
      ]).then(([r, j]) => {
        const rt = r?.text || "";
        const jt = j?.text || "";
        if (rt && jt) {
          sessionStorage.setItem(`${id}_resume`, rt);
          sessionStorage.setItem(`${id}_jd`, jt);
          doOptimize(rt, jt);
        } else {
          setError("未找到简历或岗位数据");
          setPhase("error");
        }
      }).catch(() => {
        setError("未找到简历或岗位数据，请返回重新分析");
        setPhase("error");
      });
      return;
    }

    // Check if already have paid result cached
    const cached = sessionStorage.getItem(`${id}_paid_optimize`);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        setPhase("result");
        return;
      } catch {}
    }

    doOptimize(resumeText, jdText);
  }, [id]);

  async function doOptimize(resumeText: string, jdText: string) {
    setPhase("loading");
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText, analysisId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "优化失败");
      }
      const data: RewriteResult = await res.json();
      setResult(data);
      setPhase("result");
      sessionStorage.setItem(`${id}_paid_optimize`, JSON.stringify(data));
      track("rewrite_complete", { analysisId: id, sectionCount: (data.modules || []).length });
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  }

  // Deduplicate modules
  const modules = result?.modules?.filter((m, i, arr) => {
    const first = arr.findIndex(x => x.sectionTitle === m.sectionTitle && x.original === m.original);
    return first === i;
  }) || [];

  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">AI 正在深度优化你的简历...</p>
        <p className="text-xs text-gray-400 mt-1">STAR重构 · 数据量化 · ATS关键词 · 专业术语</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push(`/result/${id}`)} className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm">返回分析报告</button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm">👑</div>
          <h1 className="text-xl font-bold text-gray-900">AI 深度优化完成</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">{result.summary}</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 mb-8 ml-10">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <span className="text-xs text-gray-500">ATS 匹配度提升</span>
          <p className="text-lg font-bold text-emerald-600">+{result.atsImprovement}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <span className="text-xs text-gray-500">岗位匹配度提升</span>
          <p className="text-lg font-bold text-blue-600">+{result.matchScoreImprovement}%</p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-4 mb-10">
        {modules.map((mod, i) => (
          <RewriteSectionCard key={i} module={mod} index={i} onInView={() => {}} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => {
            sessionStorage.setItem(`${id}_preview`, "full");
            router.push(`/rewrite/${id}/preview`);
          }}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          导出 PDF
        </button>
        <button
          onClick={() => router.push(`/result/${id}`)}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200"
        >
          返回分析报告
        </button>
      </div>
    </div>
  );
}
