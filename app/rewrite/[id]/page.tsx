"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RewriteResult } from "@/lib/types";
import { track } from "@/lib/analytics";
import RewriteSectionCard from "@/components/rewrite-section-card";
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
  const [phase, setPhase] = useState<"loading" | "result" | "error">("loading");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());

  const id = params.id as string;

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

  // Fetch rewrite
  useEffect(() => {
    const resumeText = sessionStorage.getItem(`${id}_resume`);
    const jdText = sessionStorage.getItem(`${id}_jd`);

    if (!resumeText || !jdText) {
      setError("未找到简历或 JD 数据，请返回重新分析");
      setPhase("error");
      return;
    }

    track("rewrite_start", { analysisId: id });

    fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jdText }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "改写失败");
        }
        return res.json();
      })
      .then((data: RewriteResult) => {
        setResult(data);
        setPhase("result");
        track("rewrite_complete", {
          analysisId: id,
          sectionCount: data.sections.length,
        });
        track("rewrite_preview_viewed", {
          analysisId: id,
          sectionCount: data.sections.length,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "改写失败");
        setPhase("error");
      });
  }, [id]);

  // Track time on page when leaving
  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      track("rewrite_page_time", { seconds, phase });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = result.sections
      .map(
        (s) =>
          `【${s.sectionTitle}】\n原文：${s.original}\n优化：${s.rewritten}\n原因：${s.reason}`
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    track("rewrite_copy", { sectionCount: result.sections.length });
    track("rewrite_copied", { sectionCount: result.sections.length });
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

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
          onClick={() => router.push(`/result/${id}`)}
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

  const freeSections = result.sections.slice(0, 5);
  const premiumCount = Math.max(0, result.sections.length - 5);

  // Count category distribution
  const categoryCounts = result.sections.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
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

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-8 ml-10">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{result.sections.length}</p>
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

      {/* Section Cards */}
      <div className="space-y-5">
        {freeSections.map((section, i) => (
          <RewriteSectionCard
            key={i}
            section={section}
            index={i}
            onInView={() => handleSectionInView(i)}
          />
        ))}
      </div>

      {/* Premium Teaser */}
      {premiumCount > 0 && (
        <div className="mt-5 relative rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center bg-gray-50/50">
          <div className="absolute inset-0 backdrop-blur-[2px] rounded-2xl pointer-events-none" />

          <div className="relative space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-200 mb-1">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              还有 {premiumCount} 个优化模块未展示
            </p>
            <p className="text-xs text-gray-400">
              包含更深入的行业术语和面试表达优化
            </p>

            {/* Blurred preview of next section */}
            <div className="mt-3 p-3 bg-white/60 rounded-xl blur-[3px] select-none pointer-events-none">
              <p className="text-xs text-gray-400 text-left truncate">
                {result.sections[5]?.rewritten || "..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unlock CTA + Waitlist Form */}
      <UnlockCTA premiumCount={premiumCount} />

      {/* Bottom Actions */}
      <div className="mt-10 space-y-3">
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            {copied ? (
              <>
                <span>&#x2713;</span> 已复制
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                复制优化结果
              </>
            )}
          </button>
          <button
            onClick={() => router.push(`/result/${id}`)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回分析报告
          </button>
        </div>
      </div>
    </div>
  );
}
