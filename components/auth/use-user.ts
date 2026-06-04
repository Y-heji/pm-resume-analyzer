"use client";

import { useEffect, useState } from "react";

export interface UserState {
  email: string;
  status: "free" | "active" | "expired";
  is_premium: boolean;
  activated_at: string | null;
  resume_optimize_left: number;
  mock_interview_left: number;
  loading: boolean;
}

let cached: UserState | null = null;
let fetchPromise: Promise<UserState | null> | null = null;

export function useUser(): UserState {
  const [user, setUser] = useState<UserState>(
    cached || { email: "", status: "free", is_premium: false, activated_at: null, resume_optimize_left: 0, mock_interview_left: 0, loading: true }
  );

  useEffect(() => {
    if (cached) { setUser(cached); return; }
    if (!fetchPromise) {
      fetchPromise = fetch("/api/auth/me")
        .then(r => r.json())
        .then(d => {
          if (!d.email) return null;
          const u: UserState = {
            email: d.email,
            status: d.status || "free",
            is_premium: d.is_premium || false,
            activated_at: d.activated_at || null,
            resume_optimize_left: d.resume_optimize_left || 0,
            mock_interview_left: d.mock_interview_left || 0,
            loading: false,
          };
          cached = u;
          return u;
        })
        .catch(() => null);
    }
    fetchPromise.then(u => {
      if (u) setUser(u);
      else setUser(prev => ({ ...prev, loading: false }));
    });
  }, []);

  return user;
}

// Invalidate cache after redeem/logout
export function clearUserCache() {
  cached = null;
  fetchPromise = null;
}
