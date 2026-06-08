"use client";

import { useUser } from "./use-user";

export default function PremiumBar() {
  const user = useUser();
  const labels: Record<string, string> = { job: "求职包", offer: "拿offer包" };
  const tLabel = user.tag ? (labels[user.tag] || "专业版") : "专业版";

  if (!user.is_premium) return null;

  if (user.status === "expired") {
    return (
      <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border-b border-gray-300 px-3 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 md:gap-4 text-[10px] md:text-[11px] flex-wrap">
          <span className="text-gray-600 font-medium">⏰ {tLabel}已结束</span>
          <span className="text-gray-500 hidden sm:inline">你的AI优化和面试次数已用完</span>
          <a href="#unlock-cta" className="text-blue-600 font-medium hover:text-blue-700">重新激活 →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 px-3 py-2">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 md:gap-4 text-[10px] md:text-[11px]">
        <span className="text-amber-700 font-medium">✓ {tLabel}</span>
        <span className="text-gray-600">优化 <strong className="text-gray-900">{user.resume_optimize_left}</strong></span>
        <span className="text-gray-600">面试 <strong className="text-gray-900">{user.mock_interview_left}</strong></span>
        <span className="text-emerald-600 hidden sm:inline">PDF/Word 不限</span>
      </div>
    </div>
  );
}
