"use client";

import { useState } from "react";
import Link from "next/link";

const hotSearches = [
  "AI产品经理", "产品经理", "前端开发", "后端开发",
  "数据分析", "运营", "UI设计师", "销售", "会计", "HR实习",
];

export default function Home() {
  const [guestCode, setGuestCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!guestCode.trim()) return;
    setRedeeming(true); setRedeemMsg("");
    try {
      const res = await fetch("/api/redeem-guest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: guestCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setRedeemMsg(data.error || "体验码无效"); return; }
      sessionStorage.setItem("guest_paid_interviews", String(data.paid_interviews || 1));
      sessionStorage.setItem("guest_resume_optimize", String(data.resume_optimize || 0));
      sessionStorage.setItem("unlocked", "true");
      setRedeemMsg("激活成功！即将跳转...");
      setTimeout(() => { window.location.href = "/analyze"; }, 800);
    } catch {
      setRedeemMsg("网络错误，请重试");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
        AI 职业师
      </h1>
      <p className="text-lg text-gray-500 mb-4 max-w-xl mx-auto">
        上传简历，粘贴目标岗位 JD，AI 自动分析匹配度、识别 ATS 风险、发现技能缺口，并生成专属学习路径。
      </p>
      <p className="text-xs text-gray-400 mb-8">免费开始分析，无需登录</p>

      <Link
        href="/analyze"
        className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-sm"
      >
        免费开始分析
      </Link>

      {/* Experience code entry */}
      <div className="mt-6 flex justify-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 inline-flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-500 shrink-0">🎁 有体验码？</span>
          <input
            type="text" value={guestCode} onChange={e => { setGuestCode(e.target.value); setRedeemMsg(""); }}
            onKeyDown={e => e.key === "Enter" && handleRedeem()}
            placeholder="输入体验码" className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={handleRedeem} disabled={redeeming}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {redeeming ? "..." : "激活"}
          </button>
        </div>
      </div>
      {redeemMsg && <p className={`text-xs mt-2 ${redeemMsg.includes("成功") ? "text-emerald-500" : "text-red-500"}`}>{redeemMsg}</p>}

      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-xl mx-auto">
        {hotSearches.map(tag => (
          <Link
            key={tag}
            href={`/analyze?q=${encodeURIComponent(tag)}`}
            className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F4CA;</div>
          <h3 className="font-semibold mb-1">AI 精准匹配</h3>
          <p className="text-sm text-gray-500">AI 驱动的多维度简历与 JD 匹配度分析，覆盖技能、经验、学历。</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F6E1;</div>
          <h3 className="font-semibold mb-1">ATS 风险检测</h3>
          <p className="text-sm text-gray-500">识别简历中的关键词缺失、格式问题，帮助你通过大厂 ATS 初筛。</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F5FA;</div>
          <h3 className="font-semibold mb-1">学习路径规划</h3>
          <p className="text-sm text-gray-500">根据岗位要求生成分优先级的学习路径，告诉你接下来该学什么。</p>
        </div>
      </div>
    </div>
  );
}
