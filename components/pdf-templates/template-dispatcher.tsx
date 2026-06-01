"use client";

import { useEffect, useState } from "react";
import { Document, Page } from "@react-pdf/renderer";
import { resolveTemplate } from "./registry";
import type { TemplateComponent, TemplateProps } from "./types";

interface DispatcherProps extends TemplateProps {
  templateId: string;
}

export default function TemplateDispatcher({ templateId, finalResume, deepAnalysis }: DispatcherProps) {
  const [Template, setTemplate] = useState<TemplateComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveTemplate(templateId).then((comp) => {
      if (!cancelled) setTemplate(() => comp);
    });
    return () => { cancelled = true; };
  }, [templateId]);

  if (!Template) {
    return (
      <Document>
        <Page size="A4" />
      </Document>
    );
  }

  return <Template finalResume={finalResume} deepAnalysis={deepAnalysis} />;
}
