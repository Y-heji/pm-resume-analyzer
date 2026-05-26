import { NextRequest, NextResponse } from "next/server";

// In-memory store (resets on server restart — MVP)
let events: Array<{ event: string; props?: unknown; time: number }> = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    events.push({ event: body.event, props: body.props, time: body.time || Date.now() });
    // Keep last 5000 events
    if (events.length > 5000) events = events.slice(-5000);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Aggregate stats
  const total = events.length;
  const byEvent: Record<string, number> = {};
  const pageViews = events.filter((e) => e.event === "page_view").length;
  const totalWaitlist = events.filter((e) => e.event === "waitlist_submitted" || e.event === "waitlist_submit").length;
  const totalAnalysis = events.filter((e) => e.event === "analysis_completed").length;
  const totalRewrite = events.filter((e) => e.event === "rewrite_complete").length;
  const totalPdfExport = events.filter((e) => e.event === "rewrite_pdf_export").length;
  const totalWordExport = events.filter((e) => e.event === "rewrite_word_export").length;
  const learningClicks = events.filter((e) => e.event === "learning_path_click").length;
  const jobClicks = events.filter((e) => e.event === "job_recommendation_click").length;

  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  }

  // Average page duration
  const durationEvents = events.filter((e) => e.event === "page_duration" && e.props?.seconds);
  const avgDuration = durationEvents.length > 0
    ? Math.round(durationEvents.reduce((sum, e) => sum + (e.props?.seconds as number), 0) / durationEvents.length)
    : 0;

  // Recent events (last 100)
  const recent = events.slice(-100).reverse();

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
    byEvent,
    recent,
  });
}
