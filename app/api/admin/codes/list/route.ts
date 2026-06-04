import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";
import { checkAdminAuth, adminAuthError } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return adminAuthError();

  try {
    const keys = await redis.keys("redeem:*");
    const codes: any[] = [];
    for (const k of keys) {
      const data = await redis.get(k);
      codes.push({ code: k.replace("redeem:", ""), ...(data as any) });
    }
    return NextResponse.json({ codes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
