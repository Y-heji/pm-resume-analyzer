import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCreditLogs } from "@/lib/credits";

export async function GET() {
  const email = await getCurrentUser();
  if (!email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const logs = await getCreditLogs(email);
  return NextResponse.json({ logs });
}
