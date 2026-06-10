import { NextResponse } from "next/server";
import { redis, getCurrentUser } from "@/lib/auth";

async function isAuthorized(req: Request): Promise<boolean> {
  const email = await getCurrentUser();
  if (email) return true;
  const guestCookie = req.cookies.get("guest_trial")?.value;
  if (guestCookie) return true;
  return false;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const raw = await redis.get<string>(`rewrite:${id}`);
  if (!raw) return NextResponse.json({ error: "未找到改写结果" }, { status: 404 });
  return NextResponse.json(typeof raw === "string" ? JSON.parse(raw) : raw);
}
