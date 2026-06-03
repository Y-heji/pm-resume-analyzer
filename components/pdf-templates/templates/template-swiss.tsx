import { Document, Page, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "../shared/fonts";
import type { TemplateProps } from "../types";

const LH = (fs: number) => ({ lineHeight: 1.6, fontSize: fs, hyphens: "none" });

const S = {
  page: { padding: "36pt 52pt 42pt 52pt", fontFamily: FONT_FAMILY, color: "#1a1a1a" },
  name: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 8, ...LH(24) },
  role: { color: "#2563eb", marginBottom: 4, ...LH(11) },
  contact: { color: "#999", marginBottom: 6, ...LH(9) },
  divider: { borderBottom: "1pt solid #111", marginBottom: 16 },
  summaryLabel: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#2563eb", marginBottom: 4, ...LH(10.5) },
  summaryText: { color: "#555", marginBottom: 10, ...LH(10) },
  section: { marginTop: 12 },
  sectionTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#2563eb", borderBottom: "0.5pt solid #e5e5e5", paddingBottom: 2, marginBottom: 6, ...LH(10.5) },
  entry: { marginBottom: 8 },
  entryTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#222", marginBottom: 2, ...LH(10) },
  entrySub: { color: "#bbb", marginBottom: 2, ...LH(8.5) },
  bullet: { color: "#555", marginBottom: 2, paddingLeft: 10, ...LH(10) },
  skillsText: { color: "#777", ...LH(10) },
  eduTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#222", marginBottom: 2, ...LH(10) },
  eduSub: { color: "#bbb", ...LH(9) },
};

export default function TemplateSwiss({ finalResume: data }: TemplateProps) {
  const h = data.header || { name: "", role: "", contact: "" };
  const filtered = (data.sections || []).filter(s => !s.label.includes("评价") && !s.label.includes("总结") && !s.label.includes("教育") && !s.label.includes("学历") && !s.label.includes("学校"));
  return (
    <Document title={h.name || "Resume"}>
      <Page size="A4" style={S.page}>
        <View>
          <Text style={S.name}>{h.name || "姓名"}</Text>
          {h.role ? <Text style={S.role}>{h.role}</Text> : null}
          {h.contact ? <Text style={S.contact}>{h.contact}</Text> : null}
          <View style={S.divider} />
        </View>
        <View>
          <Text style={S.summaryLabel}>个人总结</Text>
          <Text style={S.summaryText}>{data.summary || ""}</Text>
        </View>
        {filtered.map((sec, si) => (<View key={si} style={S.section}><Text style={S.sectionTitle}>{sec.label}</Text>{sec.entries.map((e, ei) => (<View key={ei} style={S.entry}><Text style={S.entryTitle}>{e.title}</Text>{e.subtitle ? <Text style={S.entrySub}>{e.subtitle}</Text> : null}{e.bullets.map((b, bi) => (<Text key={bi} style={S.bullet}>{"•"} {b}</Text>))}</View>))}</View>))}
        {data.skills && data.skills.length > 0 ? (<View style={S.section}><Text style={S.sectionTitle}>技能</Text><Text style={S.skillsText}>{data.skills.join("  ·  ")}</Text></View>) : null}
        {data.education && data.education.school ? (<View style={S.section}><Text style={S.sectionTitle}>教育背景</Text><Text style={S.eduTitle}>{data.education.school}</Text><Text style={S.eduSub}>{data.education.degree}{data.education.year ? `  |  ${data.education.year}` : ""}</Text></View>) : null}
      </Page>
    </Document>
  );
}
