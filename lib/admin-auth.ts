import { NextResponse } from "next/server";

// Simple admin auth: check for ADMIN_KEY header or env var
export function checkAdminAuth(req: Request): boolean {
  const header = req.headers.get("x-admin-key") || "";
  const envKey = process.env.ADMIN_KEY || "";
  if (!envKey) return true; // not configured → allow (dev mode)
  return header === envKey;
}

export function adminAuthError() {
  return NextResponse.json({ error: "无权限" }, { status: 403 });
}

// CSRF check: verify Origin/Referer for cookie-based auth endpoints
export function checkCsrf(req: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const host = req.headers.get("host") || "";

  // Accept same-origin or known domains
  const allowedDomains = [
    host,
    "pm-resume-analyzer.vercel.app",
    "localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean);

  const originHost = extractHost(origin);
  const refererHost = extractHost(referer);

  return allowedDomains.some(d =>
    originHost === d || originHost.endsWith("." + d) ||
    refererHost === d || refererHost.endsWith("." + d)
  ) || (!origin && !referer); // Some API clients don't send Origin/Referer
}

function extractHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export function csrfError() {
  return NextResponse.json({ error: "请求来源不被允许" }, { status: 403 });
}
