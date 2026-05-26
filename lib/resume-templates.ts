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
    sidebarWidth?: number;
  };
}

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: "ai-pm",
    name: "AI PM",
    description: "Ultra-sharp, maximum density. Name-dominant, near-invisible borders.",
    mode: "single",
    colors: { text: "#0d0d0d", muted: "#777", border: "#eee" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 24, role: 11, section: 9, body: 9, small: 8 },
      weights: { name: 700, section: 500, body: 400 },
    },
    spacing: {
      pagePadding: 40,
      headerGap: 12,
      sectionGap: 4,
      entryGap: 5,
      bulletGap: 1.5,
    },
    layout: { borderWidth: 0.5, sectionSpacing: 0.5, lineHeight: 1.45 },
  },
  {
    id: "growth",
    name: "Growth",
    description: "Visible rhythm, warm gray tones, comfortable reading pace.",
    mode: "single",
    colors: { text: "#1a1a1a", muted: "#888", border: "#b0b0b0" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 20, role: 11, section: 9.5, body: 9, small: 8 },
      weights: { name: 700, section: 700, body: 400 },
    },
    spacing: {
      pagePadding: 50,
      headerGap: 22,
      sectionGap: 8,
      entryGap: 9,
      bulletGap: 2,
    },
    layout: { borderWidth: 1, sectionSpacing: 2, lineHeight: 1.5 },
  },
  {
    id: "ats",
    name: "ATS",
    description: "Maximum readability. Largest text, highest contrast, machine-friendly.",
    mode: "single",
    colors: { text: "#000", muted: "#444", border: "#999" },
    font: {
      family: "Noto Sans SC",
      sizes: { name: 16, role: 10, section: 11, body: 10, small: 9 },
      weights: { name: 700, section: 700, body: 400 },
    },
    spacing: {
      pagePadding: 46,
      headerGap: 20,
      sectionGap: 7,
      entryGap: 8,
      bulletGap: 2,
    },
    layout: { borderWidth: 1.5, sectionSpacing: 2.5, lineHeight: 1.55 },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Dark sidebar + timeline content. Arc/Linear-inspired visual impact.",
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
