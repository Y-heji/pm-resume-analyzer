"use client";

import { useState, useEffect, useRef } from "react";
import LoginModal from "./login-modal";
import { useUser, clearUserCache } from "./use-user";

export default function AuthButton() {
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useUser();
  const loggedIn = !!user.email;

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUserCache();
    setMenuOpen(false);
    window.location.reload();
  }

  async function handleRedeem() {
    setRedeemError(""); setRedeemSuccess("");
    try {
      const res = await fetch("/api/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRedeemSuccess(`激活成功！优化×${data.resume_optimize_left||3} 面试×${data.mock_interview_left||3}`);
      sessionStorage.setItem("unlocked", "true");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setRedeemError(err.message);
    }
  }

  function handleSwitchAccount() {
    clearUserCache();
    setMenuOpen(false);
    setShowLogin(true);
  }

  function getInitial(email: string): string {
    return email.charAt(0).toUpperCase();
  }

  const totalCredits = user.resume_optimize_left + user.mock_interview_left;

  return (
    <>
      {loggedIn ? (
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
              {getInitial(user.email)}
            </div>
            <span className="text-xs text-gray-600 hidden sm:inline max-w-[120px] truncate">
              {user.email}
            </span>
            {user.status === "active" && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
                👑 {totalCredits}次可用
              </span>
            )}
            {user.status === "expired" && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
                ⏰ 已用完
              </span>
            )}
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                {user.status === "active" && (
                  <div className="mt-1">
                    <span className="text-[11px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">👑 专业版</span>
                    {user.activated_at && (
                      <span className="text-[10px] text-gray-400 ml-1">
                        激活于 {new Date(user.activated_at).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                  </div>
                )}
                {user.status === "expired" && (
                  <div className="mt-1">
                    <span className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">⏰ 已结束</span>
                    <span className="text-[10px] text-gray-400 ml-1">次数已用完</span>
                  </div>
                )}
                {user.status === "free" && (
                  <span className="text-[11px] text-gray-400">免费用户</span>
                )}
              </div>

              {/* Credits summary */}
              {user.is_premium && (
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500">AI深度优化</span>
                      <span className={`ml-1 font-medium ${user.resume_optimize_left > 0 ? "text-gray-900" : "text-gray-400"}`}>
                        {user.resume_optimize_left}次
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">AI模拟面试</span>
                      <span className={`ml-1 font-medium ${user.mock_interview_left > 0 ? "text-gray-900" : "text-gray-400"}`}>
                        {user.mock_interview_left}次
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">PDF导出</span>
                      <span className="ml-1 font-medium text-emerald-600">不限</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Word导出</span>
                      <span className="ml-1 font-medium text-emerald-600">不限</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="py-1">
                <a href="/membership" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  会员权益
                </a>
                {user.status === "expired" && (
                  <a href="#unlock-cta" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors font-medium" onClick={() => setMenuOpen(false)}>
                    重新激活 →
                  </a>
                )}
                <button onClick={() => { setShowRedeem(!showRedeem); setRedeemError(""); setRedeemSuccess(""); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  兑换码激活
                </button>
                {showRedeem && (
                  <div className="px-4 pb-2">
                    <div className="flex gap-2">
                      <input type="text" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} placeholder="输入兑换码" onKeyDown={e => e.key==="Enter" && handleRedeem()}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      <button onClick={handleRedeem} className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600">激活</button>
                    </div>
                    {redeemError && <p className="text-[10px] text-red-500 mt-1">{redeemError}</p>}
                    {redeemSuccess && <p className="text-[10px] text-emerald-600 mt-1">{redeemSuccess}</p>}
                  </div>
                )}
                <button onClick={handleSwitchAccount} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  切换账号
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          登录
        </button>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
