import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";
import { checkAdminAuth, adminAuthError } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return adminAuthError();

  try {
    let cursor: number = 0;
    const codes: any[] = [];
    do {
      const [nextCursor, batch] = await redis.scan(cursor as any, { match: "guest_code:*", count: 100 });
      cursor = Number(nextCursor);
      for (const k of batch) {
        const data = await redis.get(k);
        codes.push({ code: k.replace("guest_code:", ""), ...(data as any) });
      }
    } while (cursor !== 0);
    return NextResponse.json({ codes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
