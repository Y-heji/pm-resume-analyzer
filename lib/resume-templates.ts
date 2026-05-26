export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  mode: "single" | "split";
  colors: {
    text: string;
    muted: string;
    border: string;
    sidebarBg?: string;
    sidebarText?: string;
    accent?: string;
  };
  font: {
    family: string;
    sizes: {
      name: number;
      role: number;
      section: number;
      body: number;
      small: number;
    };
    weights: {
      name: number;
      section: number;
      body: number;
    };
  };
  spacing: {
    pagePadding: number;
    headerGap: number;
    sectionGap: number;
    entryGap: number;
    bulletGap: number;
  };
  layout: {
    borderWidth: number;
    sectionSpacing: number;
    lineHeight: number;
    sidebarWidth?: number; // percentage for split mode
  };
}

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: "ai-pm",
    name: "AI PM",
    description: "Sharp minimalism — Linear-inspired, maximum density for AI PM roles.",
    mode: "single",
    colors: { text: "#111", muted: "#666", border: "#d9d9d9" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 24, role: 11, section: 9.5, body: 9, small: 8 },
      weights: { name: 700, section: 500, body: 400 },
    },
    spacing: {
      pagePadding: 40,
      headerGap: 16,
      sectionGap: 5,
      entryGap: 6,
      bulletGap: 1,
    },
    layout: { borderWidth: 0.5, sectionSpacing: 0.8, lineHeight: 1.4 },
  },
  {
    id: "growth",
    name: "Growth",
    description: "Refined rhythm — Stripe-inspired, data-forward, warm professional.",
    mode: "single",
    colors: { text: "#1a1a1a", muted: "#777", border: "#ddd" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 22, role: 11, section: 10, body: 9.5, small: 8.5 },
      weights: { name: 700, section: 600, body: 400 },
    },
    spacing: {
      pagePadding: 46,
      headerGap: 20,
      sectionGap: 7,
      entryGap: 8,
      bulletGap: 1.5,
    },
    layout: { borderWidth: 0.75, sectionSpacing: 1.2, lineHeight: 1.5 },
  },
  {
    id: "ats",
    name: "ATS",
    description: "Clean & standard — maximum machine readability for job portals.",
    mode: "single",
    colors: { text: "#111", muted: "#555", border: "#ccc" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 18, role: 10, section: 10, body: 9.5, small: 8.5 },
      weights: { name: 700, section: 700, body: 400 },
    },
    spacing: {
      pagePadding: 44,
      headerGap: 18,
      sectionGap: 6,
      entryGap: 7,
      bulletGap: 1.5,
    },
    layout: { borderWidth: 0.75, sectionSpacing: 1.4, lineHeight: 1.45 },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Dark sidebar + content — Arc/Linear-style, high visual impact.",
    mode: "split",
    colors: {
      text: "#1a1a1a",
      muted: "#555",
      border: "#e5e5e5",
      sidebarBg: "#1e1e1e",
      sidebarText: "#d4d4d4",
      accent: "#3b82f6",
    },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 26, role: 11, section: 9.5, body: 9, small: 8 },
      weights: { name: 700, section: 600, body: 400 },
    },
    spacing: {
      pagePadding: 0,
      headerGap: 18,
      sectionGap: 8,
      entryGap: 8,
      bulletGap: 1.5,
    },
    layout: {
      borderWidth: 0.5,
      sectionSpacing: 0.8,
      lineHeight: 1.45,
      sidebarWidth: 32,
    },
  },
];

export function getTemplate(id: string): ResumeTemplate {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
