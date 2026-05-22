"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function RewriteCta({ onClick, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("rewrite_cta_view");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-12">
      <div className="relative rounded-2xl bg-gray-900 p-8 text-center shadow-lg">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <svg
              className="w-6 h-6 text-white"
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

          <h3 className="text-xl font-bold text-white mb-2">
            AI 简历优化
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
            逐段改写简历，匹配目标岗位 JD。
            每条修改包含前后对比、改写原因与优化维度。
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {["STAR 结构", "数据化", "ATS 关键词", "PM 术语", "增长表达"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300"
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => {
              track("rewrite_cta_click");
              track("rewrite_clicked");
              onClick();
            }}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
          >
            生成 AI 优化简历
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
