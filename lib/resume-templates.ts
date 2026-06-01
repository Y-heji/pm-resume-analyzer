export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: "tech" | "professional" | "creative";
}

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: "tech",
    name: "互联网大厂风",
    description: "极简高密度，高级灰配色。适合产品经理、运营、市场、商务岗位。",
    category: "tech",
  },
  {
    id: "professional",
    name: "专业商务风",
    description: "稳重居中，清晰的职业经历展示。适合销售、管理、行政、金融岗位。",
    category: "professional",
  },
  {
    id: "creative",
    name: "年轻创意风",
    description: "现代层次丰富，蓝色强调线。适合设计、新媒体、内容运营、应届生。",
    category: "creative",
  },
];

export function getTemplate(id?: string): ResumeTemplate {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
