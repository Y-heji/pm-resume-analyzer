import { NextResponse } from "next/server";
import { redis, getCurrentUser } from "@/lib/auth";

async function isAuthorized(req: Request): Promise<boolean> {
  const email = await getCurrentUser();
  if (email) return true;
  // Guest cookie check
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
  const url = new URL(req.url);
  const field = url.searchParams.get("field");

  if (field === "resume") {
    const text = await redis.get<string>(`analysis:${id}:resume`);
    if (!text) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ text });
  }
  if (field === "jd") {
    const text = await redis.get<string>(`analysis:${id}:jd`);
    if (!text) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ text });
  }

  const raw = await redis.get<string>(`analysis:${id}`);
  if (!raw) return NextResponse.json({ error: "未找到分析结果" }, { status: 404 });
  return NextResponse.json(typeof raw === "string" ? JSON.parse(raw) : raw);
}
