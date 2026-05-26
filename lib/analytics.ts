export type EventName =
  | "rewrite_cta_view"
  | "rewrite_cta_click"
  | "rewrite_start"
  | "rewrite_complete"
  | "rewrite_copy"
  | "rewrite_section_view"
  | "premium_unlock_click"
  | "result_page_view"
  | "result_tab_switch"
  | "unlock_cta_view"
  | "unlock_cta_click"
  | "waitlist_form_open"
  | "waitlist_submit"
  | "waitlist_success"
  | "rewrite_preview_expand"
  | "rewrite_page_time"
  | "resume_uploaded"
  | "analysis_completed"
  | "rewrite_clicked"
  | "rewrite_preview_viewed"
  | "unlock_cta_clicked"
  | "waitlist_submitted"
  | "rewrite_copied"
  | "learning_path_click"
  | "job_recommendation_click"
  | "rewrite_pdf_export"
  | "rewrite_word_export"
  | "page_view"
  | "page_duration";

export function track(event: EventName, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  console.log(`[Analytics] ${event}`, props ?? "");

  // Local cache
  try {
    const raw = sessionStorage.getItem("__analytics");
    const events: Array<{ event: string; props?: unknown; time: number }> = raw
      ? JSON.parse(raw)
      : [];
    events.push({ event, props, time: Date.now() });
    sessionStorage.setItem("__analytics", JSON.stringify(events.slice(-200)));
  } catch {
    // ignore
  }

  // Server-side log (fire-and-forget)
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props, time: Date.now() }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}
