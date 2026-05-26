"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export default function PageTracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const startRef = useRef(Date.now());

  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      track("page_duration", { path: pathname, seconds });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
