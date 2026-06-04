import type { FinalResume } from "@/lib/types";

function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderSections(data: FinalResume) {
  const filtered = (data.sections || []).filter((s: any) =>
    !s.label.includes("评价") && !s.label.includes("总结") && !s.label.includes("教育") && !s.label.includes("学历") && !s.label.includes("学校")
  );
  return filtered.map((s: any) => `
    <div class="sec"><div class="sec-title">${esc(s.label)}</div>
    ${s.entries.map((e: any) => `<div class="entry">
      <div class="e-title">${esc(e.title||"")}</div>
      ${e.subtitle?`<div class="e-sub">${esc(e.subtitle)}</div>`:""}
      <ul class="bullets">${(e.bullets||[]).map((b:string)=>`<li>${esc(b)}</li>`).join("")}</ul>
    </div>`).join("")}
    </div>`).join("");
}

function renderSkills(data: FinalResume) {
  return data.skills?.length ? `<div class="sec"><div class="sec-title">技能</div><div class="skills-text">${esc(data.skills.join("  ·  "))}</div></div>` : "";
}

function renderEdu(data: FinalResume) {
  return data.education?.school ? `<div class="sec"><div class="sec-title">教育背景</div><div class="edu-title">${esc(data.education.school)}</div><div class="edu-sub">${esc(data.education.degree||"")}${data.education.year?` | ${esc(data.education.year)}`:""}</div></div>` : "";
}

function renderHeader(data: FinalResume) {
  const h = data.header || { name: "姓名", role: "", contact: "" };
  return `<h1>${esc(h.name)}</h1>${h.role?`<h2>${esc(h.role)}</h2>`:""}${h.contact?`<div class="contact">${esc(h.contact)}</div>`:""}`;
}

function renderSummary(data: FinalResume) {
  return `<div class="s-title">个人总结</div><div class="s-text">${esc(data.summary||"")}</div>`;
}

const TEMPLATES: Record<string, { name: string; css: string; wrap: (html: string)=>string }> = {
  swiss: {
    name: "极简网格",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:10pt;line-height:1.6;color:#1a1a1a}.page{padding:36pt 52pt 42pt 52pt}h1{font-size:24pt;font-weight:800;color:#111;margin-bottom:4pt}h2{font-size:11pt;color:#2563eb;font-weight:400;margin-bottom:2pt}.contact{font-size:9pt;color:#999;margin-bottom:6pt}.divider{border-top:1pt solid #111;margin-bottom:16pt}.s-title{font-size:10.5pt;font-weight:700;color:#2563eb;margin-bottom:4pt}.s-text{font-size:10pt;color:#555;margin-bottom:10pt}.sec{margin-top:12pt}.sec-title{font-size:10.5pt;font-weight:700;color:#2563eb;border-bottom:0.5pt solid #e5e5e5;padding-bottom:2pt;margin-bottom:6pt}.entry{margin-bottom:8pt}.e-title{font-size:10pt;font-weight:700;color:#222;margin-bottom:2pt}.e-sub{font-size:8.5pt;color:#bbb;margin-bottom:2pt}.bullets{padding-left:10pt;list-style:none}.bullets li{font-size:10pt;color:#555;margin-bottom:2pt}.bullets li::before{content:'• ';color:#2563eb}.skills-text{font-size:10pt;color:#777}.edu-title{font-size:10pt;font-weight:700;color:#222}.edu-sub{font-size:9pt;color:#bbb}`,
    wrap: (body: string) => `<div class="page"><div class="divider" style="margin-top:6pt"></div>${body}</div>`
  },
  darkgold: {
    name: "黑金奢华",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:10pt;line-height:1.6;color:#ccc;background:#111}.page{padding:28pt 56pt 40pt 56pt}h1{font-size:24pt;font-weight:800;color:#fff;margin-bottom:4pt}h2{font-size:11pt;color:#c8a96e;font-weight:400;margin-bottom:4pt}.contact{font-size:9pt;color:#888}.s-title{font-size:10.5pt;font-weight:700;color:#c8a96e;border-bottom:0.5pt solid #c8a96e44;padding-bottom:2pt;margin-bottom:4pt;margin-top:14pt}.s-text{font-size:10pt;color:#999;margin-bottom:10pt}.sec{margin-top:12pt}.sec-title{font-size:10.5pt;font-weight:700;color:#c8a96e;border-bottom:0.5pt solid #c8a96e44;padding-bottom:2pt;margin-bottom:6pt}.entry{margin-bottom:8pt}.e-title{font-size:10.5pt;font-weight:700;color:#eee;margin-bottom:2pt}.e-sub{font-size:8.5pt;color:#888;margin-bottom:2pt}.bullets{padding-left:10pt;list-style:none}.bullets li{font-size:10pt;color:#bbb;margin-bottom:2pt}.bullets li::before{content:'• ';color:#c8a96e}.skills-text{font-size:10pt;color:#aaa}.edu-title{font-size:10.5pt;font-weight:700;color:#eee}.edu-sub{font-size:9pt;color:#888}`,
    wrap: (body: string) => `<div class="page">${body}</div>`
  },
  brutalist: {
    name: "粗野主义",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",monospace;font-size:10pt;line-height:1.5;color:#000}.page{padding:24pt 48pt 36pt 48pt;border:3pt solid #000;margin:0;min-height:100vh}h1{font-size:28pt;font-weight:900;color:#fff;background:#000;display:inline-block;padding:4pt 16pt;margin-bottom:8pt;letter-spacing:2pt}h2{font-size:12pt;font-weight:400;margin-bottom:4pt}.contact{font-size:9pt;color:#666;margin-bottom:12pt}.s-title{font-size:11pt;font-weight:900;border:2pt solid #000;display:inline-block;padding:4pt 12pt;margin-bottom:6pt;letter-spacing:1pt}.s-text{font-size:10pt;color:#333;border:2pt solid #000;padding:10pt 14pt;margin-bottom:10pt}.sec{margin-top:14pt}.sec-title{font-size:11pt;font-weight:900;border:2pt solid #000;display:inline-block;padding:4pt 12pt;margin-bottom:8pt}.entry{margin-bottom:8pt;border-left:3pt solid #000;padding-left:12pt}.e-title{font-size:10.5pt;font-weight:900;color:#000;margin-bottom:2pt}.e-sub{font-size:8.5pt;color:#666;margin-bottom:2pt}.bullets{padding-left:6pt;list-style:none}.bullets li{font-size:10pt;color:#333;margin-bottom:2pt}.bullets li::before{content:'▸ '}.skills-text{font-size:10pt;color:#333}.edu-title{font-size:10.5pt;font-weight:900}.edu-sub{font-size:9pt;color:#666}`,
    wrap: (body: string) => `<div class="page">${body}</div>`
  },
  editorial: {
    name: "杂志衬线",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Noto Serif SC","PingFang SC",serif;font-size:10.5pt;line-height:1.8;color:#2c2416;background:#e0d8cc}.page{padding:52pt 64pt 48pt 64pt;background:#faf4ea;max-width:794px;margin:0 auto}h1{font-size:36pt;font-weight:900;text-align:center;color:#1a1410;letter-spacing:2pt}h2{font-size:13pt;color:#8b7355;text-align:center;margin-top:8pt;letter-spacing:4pt;text-transform:uppercase;font-weight:400}.contact{font-size:10pt;color:#baa88a;text-align:center;margin-top:10pt}.divider{border-top:1pt solid #d4c4a8;margin:22pt 0}.s-title{font-size:16pt;font-weight:900;text-align:center;color:#5c4a2e;letter-spacing:3pt;margin-bottom:12pt}.s-text{font-size:11pt;color:#5c4a2e;line-height:1.9;text-align:justify;padding:0 30pt;margin-bottom:18pt}.sec{margin-bottom:18pt}.sec-title{font-size:14pt;font-weight:900;text-align:center;color:#5c4a2e;letter-spacing:2pt;margin-bottom:10pt}.entry{margin-bottom:16pt}.e-title{font-size:12pt;font-weight:700;text-align:center;color:#1a1410}.e-sub{font-size:10pt;color:#baa88a;text-align:center;margin:3pt 0 8pt;font-style:italic}.bullets{padding:0 40pt;list-style:none}.bullets li{font-size:10.5pt;color:#5c4a2e;margin-bottom:4pt;text-align:justify}.bullets li::before{content:'— ';color:#d4c4a8}.skills-text{font-size:10.5pt;color:#8b7355;text-align:center}.edu-title{font-size:12pt;font-weight:700;text-align:center;color:#1a1410}.edu-sub{font-size:10pt;color:#baa88a;text-align:center;font-style:italic}`,
    wrap: (body: string) => `<div class="page"><div class="divider"></div>${body}</div>`
  },
  pastel: {
    name: "柔和粉彩",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:10pt;line-height:1.65;color:#3d3929;background:#ebe3d5}.page{padding:44pt 56pt 40pt 56pt;background:#fefcf8;max-width:794px;margin:0 auto}h1{font-size:28pt;font-weight:600;color:#e07a5f}h2{font-size:12pt;color:#81b29a;font-weight:400;margin-top:4pt}.contact{font-size:10pt;color:#b0a999;margin-top:8pt}.divider{width:60pt;height:3pt;background:#f2cc8f;margin:16pt 0}.s-title{font-size:11pt;font-weight:600;color:#3d405b;border-bottom:1.5pt solid #f2cc8f22;padding-bottom:4pt;margin-bottom:8pt;letter-spacing:1pt}.s-text{font-size:10pt;color:#666;line-height:1.7;margin-bottom:14pt}.sec{margin-top:14pt}.sec-title{font-size:11pt;font-weight:600;color:#3d405b;border-bottom:1.5pt solid #f2cc8f22;padding-bottom:4pt;margin-bottom:8pt}.entry{margin-bottom:12pt;background:#fdfbf7;padding:8pt 14pt;border-radius:4pt;border:1pt solid #f0ebe3}.e-title{font-size:10.5pt;font-weight:600;color:#3d405b;margin-bottom:2pt}.e-sub{font-size:9pt;color:#b0a999;margin-bottom:3pt}.bullets{padding-left:12pt;list-style:none}.bullets li{font-size:10pt;color:#666;margin-bottom:2pt;line-height:1.55}.bullets li::before{content:'• ';color:#f2cc8f}.skills-text{font-size:10pt;color:#81b29a}.edu-title{font-size:10.5pt;font-weight:600;color:#3d405b}.edu-sub{font-size:9pt;color:#b0a999}`,
    wrap: (body: string) => `<div class="page"><div class="divider"></div>${body}</div>`
  },
  ats: {
    name: "ATS 友好现代",
    css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,"PingFang SC","Microsoft YaHei",sans-serif;font-size:10.5pt;line-height:1.45;color:#222}.page{padding:32pt 48pt 36pt 48pt}h1{font-size:22pt;font-weight:700;color:#1a1a1a;margin-bottom:2pt;text-align:left}h2{font-size:11pt;color:#444;font-weight:600;margin-bottom:6pt}.contact{font-size:9.5pt;color:#555;margin-bottom:10pt}.contact span{margin-right:12pt}.divider{height:1.5pt;background:#2b5797;margin:8pt 0 14pt 0;border:none}.s-title{font-size:11pt;font-weight:700;color:#2b5797;text-transform:uppercase;letter-spacing:0.5pt;margin-bottom:6pt;margin-top:14pt}.s-text{font-size:10.5pt;color:#333;line-height:1.5;margin-bottom:10pt}.sec{margin-top:10pt}.sec-title{font-size:11pt;font-weight:700;color:#2b5797;text-transform:uppercase;letter-spacing:0.5pt;border-bottom:1pt solid #ddd;padding-bottom:3pt;margin-bottom:8pt}.entry{margin-bottom:10pt}.e-title{font-size:10.5pt;font-weight:700;color:#1a1a1a;margin-bottom:1pt}.e-sub{font-size:9pt;color:#666;margin-bottom:3pt}.bullets{padding-left:14pt;list-style:disc}.bullets li{font-size:10pt;color:#333;margin-bottom:2pt}.skills-text{font-size:10pt;color:#444;line-height:1.5}.edu-title{font-size:10.5pt;font-weight:700;color:#1a1a1a}.edu-sub{font-size:9pt;color:#666}`,
    wrap: (body: string) => `<div class="page"><hr class="divider">${body}</div>`
  },
};

export function getTemplateIds() { return Object.keys(TEMPLATES); }
export function getTemplateName(id: string) { return TEMPLATES[id]?.name || id; }

export function renderHTML(data: FinalResume, templateId: string = "swiss"): string {
  const t = TEMPLATES[templateId] || TEMPLATES["swiss"]!;
  const body = renderHeader(data) + renderSummary(data) + renderSections(data) + renderSkills(data) + renderEdu(data);
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><style>${t.css}</style></head><body>${t.wrap(body)}</body></html>`;
}
