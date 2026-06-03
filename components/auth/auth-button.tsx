"use client";

import { useState, useEffect } from "react";
import LoginModal from "./login-modal";

export default function AuthButton() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.email) { setUser(d.email); setCredits(d.credits); }
    }).catch(() => {});
  }, []);

  return (
    <>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {credits ? `简历×${credits.resume_credits} 面试×${credits.interview_credits}` : ""}
          </span>
          <span className="text-xs font-medium text-gray-700">{user}</span>
        </div>
      ) : (
        <button onClick={() => setShowLogin(true)}
          className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          登录
        </button>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
