"use client";

import type { RewriteSection } from "@/lib/types";

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

export default function RewriteSectionCard({
  section,
  index,
  onInView,
}: {
  section: RewriteSection;
  index: number;
  onInView?: () => void;
}) {
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
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
            {index + 1}
          </span>
          <span className="font-semibold text-gray-900 text-sm">
            {section.sectionTitle}
          </span>
        </div>
        <span
          className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${
            categoryColor[section.category] || "bg-gray-100 text-gray-500 border-gray-200"
          }`}
        >
          {categoryLabel[section.category] || section.category}
        </span>
      </div>

      {/* Before -> After */}
      <div className="p-5 space-y-4">
        {/* Before */}
        <div className="relative">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            修改前
          </span>
          <div className="mt-1.5 p-3.5 bg-red-50/70 border border-red-100 rounded-xl text-sm text-gray-600 leading-relaxed relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-300 rounded-full" />
            <p className="pl-2 line-through decoration-red-300/50 decoration-1">
              {section.original}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
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
        <div>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            修改后
          </span>
          <div className="mt-1.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-sm text-gray-900 leading-relaxed relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full" />
            <p className="pl-2 font-medium">{section.rewritten}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
          <span className="shrink-0 mt-0.5 text-base">&#x1F4A1;</span>
          <span className="leading-relaxed">{section.reason}</span>
        </div>
      </div>
    </div>
  );
}
