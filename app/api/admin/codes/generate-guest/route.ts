import { NextResponse } from "next/server";
import { createGuestCodes } from "@/lib/credits";
import { checkAdminAuth, adminAuthError } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return adminAuthError();
  try {
    const { count, resumeOptimize, paidInterviews, prefix } = await req.json();
    if (!count || count > 100) return NextResponse.json({ error: "数量1-100" }, { status: 400 });

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push((prefix || "TRY") + "-" + random);
    }

    await createGuestCodes(codes, resumeOptimize || 0, paidInterviews || 1);

    return NextResponse.json({ codes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
