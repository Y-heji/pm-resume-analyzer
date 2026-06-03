"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeToken, setCodeToken] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    if (!email.includes("@")) { setError("请输入有效邮箱"); return; }
    setSending(true); setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.codeToken) setCodeToken(data.codeToken);
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), codeToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-4">登录</h3>
        {step === "email" ? (
          <>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="输入邮箱" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
              onKeyDown={(e) => e.key === "Enter" && sendCode()} />
            <button onClick={sendCode} disabled={sending}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40">
              {sending ? "发送中..." : "发送验证码"}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-1">验证码已发送到 {email}</p>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="输入6位验证码" maxLength={6} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
              onKeyDown={(e) => e.key === "Enter" && verifyCode()} />
            <button onClick={verifyCode}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
              验证登录
            </button>
          </>
        )}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button onClick={onClose} className="w-full text-xs text-gray-400 mt-3 hover:text-gray-600">取消</button>
      </div>
    </div>
  );
}
