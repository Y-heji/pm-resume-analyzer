import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const field = url.searchParams.get("field");

  // Support fetching original texts for rewrite flow
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
