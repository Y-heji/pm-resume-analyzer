export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
}

export const TEMPLATES: ResumeTemplate[] = [
  { id: "standard", name: "标准专业版", description: "简洁清晰的单栏布局，适合大多数岗位投递" },
];

export function getTemplate(id?: string): ResumeTemplate {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
