export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
}

export const TEMPLATES: ResumeTemplate[] = [
  { id: "swiss", name: "极简网格", description: "蓝色强调线，高密度信息，适合互联网/PM/运营。" },
  { id: "darkgold", name: "黑金奢华", description: "暗黑底金色强调，稳重高级，适合金融/咨询/管理。" },
  { id: "brutalist", name: "粗野主义", description: "黑白粗边框，大胆醒目，适合创意/设计/个性岗位。" },
  { id: "twocol", name: "双栏技能", description: "左侧技能栏+右侧经历，信息密度高，适合技术/开发岗。" },
];

export function getTemplate(id?: string): ResumeTemplate {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
