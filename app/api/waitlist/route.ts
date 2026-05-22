import { NextRequest, NextResponse } from "next/server";
import type { WaitlistEntry } from "@/lib/types";
import { getEntries, addEntry } from "@/lib/waitlist-storage";

export async function POST(req: Request) {
  try {
    const { email, jobDirection, jobStatus } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "请填写有效的邮箱地址" },
        { status: 400 }
      );
    }

    if (!jobDirection) {
      return NextResponse.json(
        { error: "请选择求职方向" },
        { status: 400 }
      );
    }

    if (!jobStatus) {
      return NextResponse.json(
        { error: "请选择求职状态" },
        { status: 400 }
      );
    }

    const entries = await getEntries();

    const exists = entries.some(
      (e) => e.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { message: "该邮箱已在等待列表中" },
        { status: 200 }
      );
    }

    const entry: WaitlistEntry = {
      email: email.toLowerCase().trim(),
      jobDirection: jobDirection.trim(),
      jobStatus: jobStatus.trim(),
      createdAt: new Date().toISOString(),
    };

    await addEntry(entry);

    return NextResponse.json(
      { message: "预约成功！上线后会第一时间通知你", entry },
      { status: 201 }
    );
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "提交失败，请重试" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const entries = await getEntries();
  return NextResponse.json(entries);
}
