import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";
import { checkAdminAuth, adminAuthError } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return adminAuthError();
  try {
    const { codes } = await req.json();
    if (!codes || !Array.isArray(codes)) return NextResponse.json({ error: "codes required" }, { status: 400 });

    for (const c of codes) {
      await redis.del(`redeem:${c}`);
      await redis.del(`guest_code:${c}`);
    }
    return NextResponse.json({ deleted: codes.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
