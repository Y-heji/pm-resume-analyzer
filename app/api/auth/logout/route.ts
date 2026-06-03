import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("pm_token", "", { path: "/", maxAge: 0 });
  return res;
}
