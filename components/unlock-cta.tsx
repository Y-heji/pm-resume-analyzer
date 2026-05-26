"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

const FULL_VERSION_FEATURES = [
  { icon: "&#x1F4DD;", label: "完整项目经历 AI 重写" },
  { icon: "&#x1F3AF;", label: "ATS 关键词全面注入" },
  { icon: "&#x1F4C8;", label: "数据化表达增强" },
  { icon: "&#x2B50;", label: "STAR 结构完整优化" },
  { icon: "&#x1F9E0;", label: "AI PM 行业术语增强" },
  { icon: "&#x1F4CA;", label: "增长与数据驱动表达" },
  { icon: "&#x1F4BC;", label: "工作经验专业化改写" },
  { icon: "&#x1F4E4;", label: "导出专业 PDF 简历" },
];

const JOB_DIRECTIONS = ["AI PM", "产品经理", "数据分析", "运营", "技术转PM", "其他"];
const JOB_STATUSES = ["在职看机会", "已离职求职中", "校招", "转行", "观望中"];

interface Props {
  premiumCount: number;
}

export default function UnlockCTA({ premiumCount }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [jobDirection, setJobDirection] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track CTA view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("unlock_cta_view", { premiumCount });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [premiumCount]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !jobDirection || !jobStatus) return;

      track("waitlist_submit", { jobDirection, jobStatus });
      track("unlock_cta_clicked", { jobDirection, jobStatus });
      track("waitlist_submitted", { jobDirection, jobStatus });
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            jobDirection,
            jobStatus,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "提交失败");
        }

        setSubmitted(true);
        track("waitlist_success", { jobDirection, jobStatus });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "提交失败，请重试"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, jobDirection, jobStatus]
  );

  return (
    <div ref={ref} className="mt-12">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          解锁完整版
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Feature checklist */}
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            解锁完整 AI 优化版
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            当前仅展示前 6 个模块。完整版覆盖所有改写维度 + 导出专业 PDF。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
            {FULL_VERSION_FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50"
              >
                <span
                  className="text-sm shrink-0"
                  dangerouslySetInnerHTML={{ __html: f.icon }}
                />
                <span className="text-sm text-gray-700">{f.label}</span>
              </div>
            ))}
          </div>

          {premiumCount > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              还有 {premiumCount} 个模块等待解锁
            </p>
          )}
        </div>

        {/* Payment + Unlock */}
        <div className="border-t border-gray-100 p-6 md:p-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            立即解锁 — ￥19.9
          </h4>
          <p className="text-xs text-gray-500 mb-4">
            微信/支付宝付款后获取解锁码。一次付费，永久使用。
          </p>
          <UnlockCodeInput />
        </div>

        {/* Waitlist Form */}
        <div className="border-t border-gray-100 p-6 md:p-8 bg-gray-50/50">
          {submitted ? (
            /* Success State */
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-4">
                <svg
                  className="w-7 h-7 text-emerald-600"
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
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                预约成功！
              </h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                完整版上线后会第一时间发送到 {email}
                <br />
                届时可免费体验。
              </p>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow placeholder:text-gray-300"
                />
              </div>

              {/* Job Direction & Status side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    求职方向 <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={jobDirection}
                    onChange={(e) => setJobDirection(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="" className="text-gray-300">
                      请选择
                    </option>
                    {JOB_DIRECTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    求职状态 <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="" className="text-gray-300">
                      请选择
                    </option>
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !email.trim() ||
                  !jobDirection ||
                  !jobStatus
                }
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    提交中...
                  </>
                ) : (
                  <>
                    预约解锁完整版
                    <span className="text-base">&rarr;</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                限时免费预约 · 上线后第一时间通知
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline unlock code input ──────────────────────────────────

function UnlockCodeInput() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleUnlock = () => {
    const validCode = process.env.NEXT_PUBLIC_UNLOCK_CODE || "pm2026";
    if (code.trim() === validCode) {
      sessionStorage.setItem("unlocked", "true");
      setStatus("success");
      setTimeout(() => window.location.reload(), 800);
    } else {
      setStatus("error");
    }
  };

  if (sessionStorage.getItem("unlocked") === "true") {
    return (
      <p className="text-xs text-emerald-600 font-medium">
        &#x2713; 已解锁完整版
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => { setCode(e.target.value); setStatus("idle"); }}
        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        placeholder="输入解锁码"
        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        onClick={handleUnlock}
        className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shrink-0"
      >
        解锁
      </button>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-1">解锁码错误</p>
      )}
      {status === "success" && (
        <p className="text-xs text-emerald-600 mt-1">解锁成功！</p>
      )}
    </div>
  );
}
