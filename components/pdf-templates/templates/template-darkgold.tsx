import { Document, Page, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "../shared/fonts";
import type { TemplateProps } from "../types";

const G = "#c8a96e";
const LH = (fs: number) => ({ lineHeight: 1.6, fontSize: fs, hyphens: "none" });

const S = {
  page: { backgroundColor: "#111", fontFamily: FONT_FAMILY, color: "#ccc" },
  headerBox: { backgroundColor: "#111", padding: "28pt 56pt 20pt 56pt" },
  name: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#fff", marginBottom: 8, ...LH(24) },
  role: { color: G, marginBottom: 4, ...LH(11) },
  contact: { color: "#888", ...LH(9) },
  body: { padding: "20pt 56pt 40pt 56pt", backgroundColor: "#111" },
  summaryLabel: { fontFamily: `${FONT_FAMILY}-Bold`, color: G, borderBottom: "0.5pt solid #c8a96e44", paddingBottom: 2, marginBottom: 4, ...LH(10.5) },
  summaryText: { color: "#999", marginBottom: 10, ...LH(10) },
  section: { marginTop: 12 },
  sectionTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: G, borderBottom: "0.5pt solid #c8a96e44", paddingBottom: 2, marginBottom: 6, ...LH(10.5) },
  entry: { marginBottom: 8 },
  entryTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#eee", marginBottom: 2, ...LH(10.5) },
  entrySub: { color: "#888", marginBottom: 2, ...LH(8.5) },
  bullet: { color: "#bbb", marginBottom: 2, paddingLeft: 10, ...LH(10) },
  skillsText: { color: "#aaa", ...LH(10) },
  eduTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#eee", marginBottom: 2, ...LH(10.5) },
  eduSub: { color: "#888", ...LH(9) },
};

export default function TemplateDarkGold({ finalResume: data }: TemplateProps) {
  const h = data.header || {};
  const f = (data.sections || []).filter(s => !s.label.includes("评价") && !s.label.includes("总结") && !s.label.includes("教育") && !s.label.includes("学历") && !s.label.includes("学校"));
  return (
    <Document title={h.name || "Resume"}>
      <Page size="A4" style={S.page}>
        <View style={S.headerBox}>
          <Text style={S.name}>{h.name || "姓名"}</Text>
          {h.role ? <Text style={S.role}>{h.role}</Text> : null}
          {h.contact ? <Text style={S.contact}>{h.contact}</Text> : null}
        </View>
        <View style={S.body}>
          <View><Text style={S.summaryLabel}>PROFESSIONAL SUMMARY</Text><Text style={S.summaryText}>{data.summary || ""}</Text></View>
          {f.map((s, si) => (<View key={si} style={S.section}><Text style={S.sectionTitle}>{s.label}</Text>{s.entries.map((e, ei) => (<View key={ei} style={S.entry}><Text style={S.entryTitle}>{e.title}</Text>{e.subtitle ? <Text style={S.entrySub}>{e.subtitle}</Text> : null}{e.bullets.map((b, bi) => (<Text key={bi} style={S.bullet}>{"•"} {b}</Text>))}</View>))}</View>))}
          {data.skills && data.skills.length > 0 ? (<View style={S.section}><Text style={S.sectionTitle}>EXPERTISE</Text><Text style={S.skillsText}>{data.skills.join("  ·  ")}</Text></View>) : null}
          {data.education && data.education.school ? (<View style={S.section}><Text style={S.sectionTitle}>EDUCATION</Text><Text style={S.eduTitle}>{data.education.school}</Text><Text style={S.eduSub}>{data.education.degree}{data.education.year ? ` | ${data.education.year}` : ""}</Text></View>) : null}
        </View>
      </Page>
    </Document>
  );
}
