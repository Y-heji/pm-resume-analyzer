import { redis } from "./auth";

// ─── Entitlements ────────────────────────────────────────
// Three-state model: FREE | PREMIUM_ACTIVE | PREMIUM_EXPIRED

export type MemberStatus = "free" | "active" | "expired";

export interface Entitlements {
  status: MemberStatus;
  activated_at: string | null;
  resume_optimize_left: number;
  mock_interview_left: number;
}

// Derived flag: premium = was ever activated (doesn't mean currently active)
export function isPremium(e: Entitlements): boolean {
  return e.status === "active" || e.status === "expired";
}

function key(email: string) { return `entitlements:${email}`; }
function logKey(email: string) { return `credit_log:${email}`; }

// ─── CRUD ───────────────────────────────────────────────

export async function getEntitlements(email: string): Promise<Entitlements> {
  const data = await redis.get<Entitlements>(key(email));
  return data || { status: "free", activated_at: null, resume_optimize_left: 0, mock_interview_left: 0 };
}

async function setEntitlements(email: string, e: Entitlements): Promise<void> {
  await redis.set(key(email), e);
}

// Check if all credits exhausted → transition to expired
function checkExpired(e: Entitlements): Entitlements {
  if (e.status === "active" && e.resume_optimize_left <= 0 && e.mock_interview_left <= 0) {
    e.status = "expired";
  }
  return e;
}

// ─── Consume (atomic via Redis Lua) ──────────────────────

const ATOMIC_CONSUME_SCRIPT = `
  local key = KEYS[1]
  local field = ARGV[1]
  local raw = redis.call('GET', key)
  if not raw then return -1 end
  local data = cjson.decode(raw)
  if not data[field] or data[field] <= 0 then return 0 end
  data[field] = data[field] - 1
  redis.call('SET', key, cjson.encode(data))
  return 1
`;

export async function consumeResumeOptimize(email: string): Promise<boolean> {
  try {
    const result = await redis.eval(ATOMIC_CONSUME_SCRIPT, [key(email)], ["resume_optimize_left"]) as number;
    if (result === 1) {
      // Check and transition to expired if all credits gone
      const e = await getEntitlements(email);
      if (e.resume_optimize_left <= 0 && e.mock_interview_left <= 0 && e.status === "active") {
        e.status = "expired";
        await setEntitlements(email, e);
      }
      await log(email, "resume_optimize", -1, "AI深度简历优化");
      return true;
    }
    return false;
  } catch {
    const e = await getEntitlements(email);
    if (e.resume_optimize_left <= 0) return false;
    e.resume_optimize_left--;
    e.status = checkExpired(e).status;
    await setEntitlements(email, e);
    await log(email, "resume_optimize", -1, "AI深度简历优化");
    return true;
  }
}

export async function consumeMockInterview(email: string): Promise<boolean> {
  try {
    const result = await redis.eval(ATOMIC_CONSUME_SCRIPT, [key(email)], ["mock_interview_left"]) as number;
    if (result === 1) {
      const e = await getEntitlements(email);
      if (e.resume_optimize_left <= 0 && e.mock_interview_left <= 0 && e.status === "active") {
        e.status = "expired";
        await setEntitlements(email, e);
      }
      await log(email, "mock_interview", -1, "AI模拟面试");
      return true;
    }
    return false;
  } catch {
    const e = await getEntitlements(email);
    if (e.mock_interview_left <= 0) return false;
    e.mock_interview_left--;
    e.status = checkExpired(e).status;
    await setEntitlements(email, e);
    await log(email, "mock_interview", -1, "AI模拟面试");
    return true;
  }
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
  // Mark as used instead of deleting, so admin can track
  const existing = await redis.get(`redeem:${code}`);
  if (existing) {
    await redis.set(`redeem:${code}`, { ...(existing as any), used: true, used_by: email, used_at: new Date().toISOString() });
  }
  await log(email, "redeem", 0, `兑换码 ${code} 已使用并销毁`);
}

// Redeem a code: activates premium + sets entitlements
export async function redeemCode(email: string, code: string): Promise<RedeemCode | null> {
  const redeem = await getRedeemCode(code);
  if (!redeem) return null;
  if (redeem.used) return null;

  const e = await getEntitlements(email);
  e.status = "active";
  e.activated_at = e.activated_at || new Date().toISOString();
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

export async function createGuestCodes(codes: string[], resumeOptimize: number, paidInterviews: number): Promise<void> {
  for (const code of codes) {
    await redis.set(`guest_code:${code}`, {
      resume_optimize: resumeOptimize,
      paid_interviews: paidInterviews,
      used: false,
      created_at: new Date().toISOString(),
    });
  }
}

export async function redeemGuestCode(code: string): Promise<{ resume_optimize: number; paid_interviews: number } | null> {
  const key = `guest_code:${code}`;
  const data = await redis.get<{ resume_optimize: number; paid_interviews: number; used: boolean }>(key);
  if (!data || data.used) return null;
  // Mark as used instead of deleting
  await redis.set(key, { ...data, used: true, used_at: new Date().toISOString() });
  return { resume_optimize: data.resume_optimize || 0, paid_interviews: data.paid_interviews || 0 };
}
