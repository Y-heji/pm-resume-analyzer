"use client";

import { useEffect, useState } from "react";

interface Entitlements {
  email: string;
  is_premium: boolean;
  activated_at: string | null;
  resume_optimize_left: number;
  mock_interview_left: number;
}

export default function MembershipPage() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) {
          setEntitlements(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!entitlements?.email) return;
    fetch("/api/auth/logs")
      .then((r) => r.json())
      .then((d) => {
        if (d.logs) setLogs(d.logs);
      })
      .catch(() => {});
  }, [entitlements?.email]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!entitlements) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-gray-500 mb-4">请先登录</p>
        <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
          返回首页
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold mb-8">会员权益</h1>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
              {entitlements.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {entitlements.email}
              </p>
              <p className="text-xs text-gray-500">
                账号邮箱
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">会员状态</span>
              {entitlements.is_premium ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  👑 专业版已激活
                </span>
              ) : (
                <span className="text-sm text-gray-400">免费用户</span>
              )}
            </div>

            {entitlements.activated_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">激活时间</span>
                <span className="text-sm text-gray-900">
                  {new Date(entitlements.activated_at).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entitlements Detail */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">权益情况</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">AI深度优化</p>
                <p className="text-[11px] text-gray-400">
                  基于 JD + ATS 规则逐段深度改写
                </p>
              </div>
              {entitlements.is_premium ? (
                <span className="text-sm font-bold text-gray-900">
                  {entitlements.resume_optimize_left}
                  <span className="text-xs text-gray-400 font-normal"> 次可用</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">需激活专业版</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">AI模拟面试</p>
                <p className="text-[11px] text-gray-400">
                  个性化深度面试 + 追问 + 完整报告
                </p>
              </div>
              {entitlements.is_premium ? (
                <span className="text-sm font-bold text-gray-900">
                  {entitlements.mock_interview_left}
                  <span className="text-xs text-gray-400 font-normal"> 次可用</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">需激活专业版</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">PDF导出</p>
                <p className="text-[11px] text-gray-400">专业格式化 PDF 简历</p>
              </div>
              {entitlements.is_premium ? (
                <span className="text-sm font-bold text-emerald-600">不限次数</span>
              ) : (
                <span className="text-sm text-gray-400">预览模式</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Word导出</p>
                <p className="text-[11px] text-gray-400">可编辑 Word 文档</p>
              </div>
              {entitlements.is_premium ? (
                <span className="text-sm font-bold text-emerald-600">不限次数</span>
              ) : (
                <span className="text-sm text-gray-400">需激活专业版</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">权益消耗记录</h2>
            <div className="space-y-2">
              {logs.slice(0, 20).map((entry: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-xs text-gray-700">{entry.detail}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(entry.time).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      entry.amount > 0 ? "text-emerald-600" : "text-red-400"
                    }`}
                  >
                    {entry.amount > 0 ? "+" : ""}
                    {entry.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8 text-center">
        <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
          返回首页
        </a>
      </div>
    </div>
  );
}
