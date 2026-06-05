"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

export default function PageTracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startRef = useRef(Date.now());

  useEffect(() => {
    // Capture campaign source on first load
    const source = searchParams.get("from") || searchParams.get("utm_source") || searchParams.get("ref");
    if (source) {
      sessionStorage.setItem("campaign_source", source);
    }
    track("page_view", { path: pathname, source: source || undefined });
  }, [pathname]); // eslint-disable-line

  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      track("page_duration", { path: pathname, seconds });
    };
  }, []); // eslint-disable-line

  return <>{children}</>;
}
