"use client";

import type { RewriteModule } from "@/lib/types";

const categoryLabel: Record<string, string> = {
  star: "STAR 结构",
  data: "数据化表达",
  ats: "ATS 关键词",
  keyword: "PM 专业术语",
  growth: "增长表达",
  professional: "专业化",
};

const categoryColor: Record<string, string> = {
  star: "bg-indigo-50 text-indigo-600 border-indigo-100",
  data: "bg-emerald-50 text-emerald-600 border-emerald-100",
  ats: "bg-amber-50 text-amber-600 border-amber-100",
  keyword: "bg-violet-50 text-violet-600 border-violet-100",
  growth: "bg-rose-50 text-rose-600 border-rose-100",
  professional: "bg-sky-50 text-sky-600 border-sky-100",
};

function sourceIcon(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("work") || s.includes("工作")) return "\u{1F4BC}";
  if (s.includes("project") || s.includes("项目")) return "\u{1F3D7}";
  if (s.includes("self") || s.includes("intro") || s.includes("个人") || s.includes("自我")) return "\u{1F4CB}";
  if (s.includes("skill") || s.includes("技能")) return "\u{1F6E0}";
  if (s.includes("edu") || s.includes("教育")) return "\u{1F393}";
  return "\u{270F}";
}

function sourceLabel(source: string): string {
  const prefix = source.split("·")[0]?.trim() || "";
  const map: Record<string, string> = {
    "Work Experience": "工作经历",
    "工作经历": "工作经历",
    "Project": "项目经历",
    "项目经历": "项目经历",
    "Self Introduction": "自我介绍",
    "自我介绍": "自我介绍",
    "Skills": "技能",
    "技能": "技能",
    "Education": "教育",
    "教育背景": "教育",
  };
  return map[prefix] || prefix || "优化";
}

export default function RewriteSectionCard({
  module: m,
  index,
  onInView,
  locked,
  onUnlock,
}: {
  module: RewriteModule;
  index: number;
  onInView?: () => void;
  locked?: boolean;
  onUnlock?: () => void;
}) {
  const si = m.scoreImprovement || { ats: 0, professionalism: 0, dataDriven: 0 };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
      data-section-index={index}
      ref={(el) => {
        if (!el || !onInView) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              onInView();
              observer.disconnect();
            }
          },
          { threshold: 0.4 }
        );
        observer.observe(el);
      }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-xs flex items-center justify-center font-semibold shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-gray-900 text-sm block truncate">
              {m.sectionTitle}
            </span>
            <span className="text-[11px] text-gray-400">
              {sourceIcon(m.sourceSection || "")} {sourceLabel(m.sourceSection || "")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Score improvement badges */}
          {si.ats > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              ATS +{si.ats}
            </span>
          )}
          {si.professionalism > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
              专业 +{si.professionalism}
            </span>
          )}
          {si.dataDriven > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
              数据 +{si.dataDriven}
            </span>
          )}
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${
              categoryColor[m.category] || "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {categoryLabel[m.category] || m.category}
          </span>
        </div>
      </div>

      {/* Before -> After */}
      <div className={`p-5 space-y-4 relative ${locked ? "select-none" : ""}`}>
        {/* Before */}
        <div className={`relative ${locked ? "blur-[4px]" : ""}`}>
          <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">
            优化前
          </span>
          <div className="mt-1.5 p-3.5 bg-red-50/80 border border-red-200 rounded-xl text-sm text-gray-600 leading-relaxed relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-full" />
            <p className="pl-3 line-through decoration-red-300 decoration-1">
              {m.original}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className={`flex justify-center ${locked ? "blur-[4px]" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* After */}
        <div className={locked ? "blur-[4px]" : ""}>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            优化后
          </span>
          <div className="mt-1.5 p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl text-sm text-gray-900 leading-relaxed relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
            <p className="pl-3 font-medium">{m.rewritten}</p>
          </div>
        </div>

        {/* Optimization Reasons */}
        <div className={`p-3.5 bg-gray-50 rounded-xl space-y-2 ${locked ? "blur-[4px]" : ""}`}>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            优化维度
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {m.optimizationReasons.map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600"
              >
                <span className="w-1 h-1 rounded-full bg-gray-400" />
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* Lock Overlay */}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl z-10">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-3">解锁完整 AI 优化版</p>
            {onUnlock && (
              <button
                onClick={onUnlock}
                className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                立即解锁
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
