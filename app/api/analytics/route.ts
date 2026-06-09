import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/auth";

const EVENTS_KEY = "analytics:events";
const COUNTERS_KEY = "analytics:counters";
const MAX_EVENTS = 5000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.event as string;
    const time = body.time || Date.now();

    // Store event in Redis list
    const entry = JSON.stringify({ event, props: body.props, time });
    await redis.lpush(EVENTS_KEY, entry);
    await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1);

    // Increment atomic counter
    await redis.hincrby(COUNTERS_KEY, event, 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Analytics POST error:", err);
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read event list and counters in parallel
    const [rawEvents, counters] = await Promise.all([
      redis.lrange(EVENTS_KEY, 0, MAX_EVENTS - 1),
      redis.hgetall<Record<string, string>>(COUNTERS_KEY),
    ]);

    const count = (e: string) => parseInt(counters?.[e] || "0", 10);

    const pageViews = count("page_view");
    const totalWaitlist = count("waitlist_submitted") + count("waitlist_submit");
    const totalAnalysis = count("analysis_completed");
    const totalRewrite = count("rewrite_complete");
    const totalPdfExport = count("rewrite_pdf_export");
    const totalWordExport = count("rewrite_word_export");
    const learningClicks = count("learning_path_click");
    const jobClicks = count("job_recommendation_click");

    // Parse events for recent + duration
    const events: Array<{ event: string; props?: Record<string, unknown>; time: number }> = [];
    if (Array.isArray(rawEvents)) {
      for (const raw of rawEvents) {
        try {
          events.push(typeof raw === "string" ? JSON.parse(raw) : raw);
        } catch { /* skip malformed */ }
      }
    }

    const total = events.length;
    const durationEvents = events.filter(
      (e) => e.event === "page_duration" && (e.props as any)?.seconds
    );
    const avgDuration =
      durationEvents.length > 0
        ? Math.round(
            durationEvents.reduce((sum, e) => sum + ((e.props as any)?.seconds || 0), 0) /
              durationEvents.length
          )
        : 0;

    const recent = events.slice(0, 100);

    return NextResponse.json({
      total,
      pageViews,
      totalWaitlist,
      totalAnalysis,
      totalRewrite,
      totalPdfExport,
      totalWordExport,
      learningClicks,
      jobClicks,
      avgDuration,
      byEvent: counters || {},
      recent,
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
