import { NextResponse } from "next/server";
import { redis } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = await redis.get<string>(`rewrite:${id}`);
  if (!raw) return NextResponse.json({ error: "未找到改写结果" }, { status: 404 });
  return NextResponse.json(typeof raw === "string" ? JSON.parse(raw) : raw);
}
