import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCredits } from "@/lib/credits";

export async function GET() {
  const email = await getCurrentUser();
  if (!email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const credits = await getCredits(email);
  return NextResponse.json({ email, credits });
}
