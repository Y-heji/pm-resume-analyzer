import type { FinalResume } from "@/lib/types";

export interface DeepData {
  atsReport?: { score: number; missingKeywords?: string[]; tips?: string[] };
  hrReview?: { strengths?: string[]; risks?: string[]; interviewFocus?: string[]; impression?: string };
  coreAdvantage?: string;
  personalizedAdvice?: string;
}

export interface TemplateProps {
  finalResume: FinalResume;
  deepAnalysis?: DeepData;
}

export type TemplateComponent = React.ComponentType<TemplateProps>;
