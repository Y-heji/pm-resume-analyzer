import { redis } from "./auth";

export interface Credits {
  resume_credits: number;
  interview_credits: number;
  premium_status: boolean;
}

function creditKey(email: string) { return `credits:${email}`; }
function logKey(email: string) { return `credit_log:${email}`; }

// ═══ CRUD ═══

export async function getCredits(email: string): Promise<Credits> {
  const data = await redis.get<Credits>(creditKey(email));
  return data || { resume_credits: 0, interview_credits: 0, premium_status: false };
}

export async function setCredits(email: string, c: Credits): Promise<void> {
  await redis.set(creditKey(email), c);
}

// ═══ Consume ═══

export async function consumeResumeCredit(email: string): Promise<boolean> {
  const c = await getCredits(email);
  if (c.resume_credits <= 0) return false;
  c.resume_credits--;
  await setCredits(email, c);
  await logCredit(email, "resume", -1, "AI深度简历优化");
  return true;
}

export async function consumeInterviewCredit(email: string): Promise<boolean> {
  const c = await getCredits(email);
  if (c.interview_credits <= 0) return false;
  c.interview_credits--;
  await setCredits(email, c);
  await logCredit(email, "interview", -1, "AI模拟面试");
  return true;
}

export async function hasPremiumAccess(email: string): Promise<boolean> {
  const c = await getCredits(email);
  return c.premium_status || c.resume_credits > 0;
}

// ═══ Add Credits (from redeem codes) ═══

export async function addCredits(
  email: string,
  resume: number,
  interview: number,
  detail: string
): Promise<void> {
  const c = await getCredits(email);
  c.resume_credits += resume;
  c.interview_credits += interview;
  await setCredits(email, c);
  if (resume > 0) await logCredit(email, "resume", resume, detail);
  if (interview > 0) await logCredit(email, "interview", interview, detail);
}

// ═══ Redeem Code ═══

export interface RedeemCode {
  resume_credits: number;
  interview_credits: number;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

export async function getRedeemCode(code: string): Promise<RedeemCode | null> {
  return redis.get<RedeemCode>(`redeem:${code}`);
}

export async function markCodeUsed(code: string, email: string): Promise<void> {
  await redis.del(`redeem:${code}`);
  await logCredit(email, "redeem", 0, `兑换码 ${code} 已使用并销毁`);
}

export async function createRedeemCodes(
  codes: string[],
  resumeCredits: number,
  interviewCredits: number
): Promise<void> {
  for (const code of codes) {
    await redis.set(`redeem:${code}`, {
      resume_credits: resumeCredits,
      interview_credits: interviewCredits,
      used: false,
      used_by: null,
      created_at: new Date().toISOString(),
    });
  }
}

// ═══ Credit Log ═══

export async function logCredit(
  email: string,
  type: "resume" | "interview",
  amount: number,
  detail: string
): Promise<void> {
  const entry = {
    type,
    amount,
    detail,
    time: new Date().toISOString(),
  };
  await redis.lpush(logKey(email), entry);
  await redis.ltrim(logKey(email), 0, 199); // keep last 200
}

export async function getCreditLogs(email: string): Promise<any[]> {
  return redis.lrange(logKey(email), 0, -1) as any;
}
