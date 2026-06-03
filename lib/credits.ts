import { redis } from "./auth";

// ─── Entitlements (replaces old Credits) ────────────────

export interface Entitlements {
  is_premium: boolean;
  activated_at: string | null;
  resume_optimize_left: number;
  mock_interview_left: number;
}

function key(email: string) { return `entitlements:${email}`; }
function logKey(email: string) { return `credit_log:${email}`; }

// ─── CRUD ───────────────────────────────────────────────

export async function getEntitlements(email: string): Promise<Entitlements> {
  const data = await redis.get<Entitlements>(key(email));
  return data || { is_premium: false, activated_at: null, resume_optimize_left: 0, mock_interview_left: 0 };
}

async function setEntitlements(email: string, e: Entitlements): Promise<void> {
  await redis.set(key(email), e);
}

// ─── Consume ────────────────────────────────────────────

export async function consumeResumeOptimize(email: string): Promise<boolean> {
  const e = await getEntitlements(email);
  if (e.resume_optimize_left <= 0) return false;
  e.resume_optimize_left--;
  await setEntitlements(email, e);
  await log(email, "resume_optimize", -1, "AI深度简历优化");
  return true;
}

export async function consumeMockInterview(email: string): Promise<boolean> {
  const e = await getEntitlements(email);
  if (e.mock_interview_left <= 0) return false;
  e.mock_interview_left--;
  await setEntitlements(email, e);
  await log(email, "mock_interview", -1, "AI模拟面试");
  return true;
}

export async function isPremium(email: string): Promise<boolean> {
  const e = await getEntitlements(email);
  return e.is_premium;
}

// ─── Redeem Code ────────────────────────────────────────

export interface RedeemCode {
  resume_optimize: number;
  mock_interview: number;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

export async function getRedeemCode(code: string): Promise<RedeemCode | null> {
  return redis.get<RedeemCode>(`redeem:${code}`);
}

export async function markCodeUsed(code: string, email: string): Promise<void> {
  await redis.del(`redeem:${code}`);
  await log(email, "redeem", 0, `兑换码 ${code} 已使用并销毁`);
}

// Redeem a code: activates premium + sets entitlements
export async function redeemCode(email: string, code: string): Promise<RedeemCode | null> {
  const redeem = await getRedeemCode(code);
  if (!redeem) return null;
  if (redeem.used) return null;

  const e = await getEntitlements(email);
  e.is_premium = true;
  e.activated_at = new Date().toISOString();
  e.resume_optimize_left += redeem.resume_optimize;
  e.mock_interview_left += redeem.mock_interview;
  await setEntitlements(email, e);
  await markCodeUsed(code, email);

  return redeem;
}

export async function createRedeemCodes(
  codes: string[],
  resumeOptimize: number,
  mockInterview: number
): Promise<void> {
  for (const code of codes) {
    await redis.set(`redeem:${code}`, {
      resume_optimize: resumeOptimize,
      mock_interview: mockInterview,
      used: false,
      used_by: null,
      created_at: new Date().toISOString(),
    });
  }
}

// ─── Credit Log ─────────────────────────────────────────

async function log(
  email: string,
  type: string,
  amount: number,
  detail: string
): Promise<void> {
  const entry = { type, amount, detail, time: new Date().toISOString() };
  await redis.lpush(logKey(email), entry);
  await redis.ltrim(logKey(email), 0, 199);
}

export async function getCreditLogs(email: string): Promise<any[]> {
  return redis.lrange(logKey(email), 0, -1) as any;
}

// ─── Guest Codes (one-time, no login) ────────────────────

export async function createGuestCodes(codes: string[], paidInterviews: number): Promise<void> {
  for (const code of codes) {
    await redis.set(`guest_code:${code}`, {
      paid_interviews: paidInterviews,
      used: false,
      created_at: new Date().toISOString(),
    });
  }
}

export async function redeemGuestCode(code: string): Promise<number | null> {
  const key = `guest_code:${code}`;
  const data = await redis.get<{ paid_interviews: number; used: boolean }>(key);
  if (!data || data.used) return null;
  await redis.del(key); // one-time: destroy immediately
  return data.paid_interviews;
}
