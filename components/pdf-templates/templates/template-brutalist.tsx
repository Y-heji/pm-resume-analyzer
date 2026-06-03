import { Document, Page, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "../shared/fonts";
import type { TemplateProps } from "../types";

const LH = (fs: number) => ({ lineHeight: 1.6, fontSize: fs, hyphens: "none" });

const S = {
  page: { fontFamily: FONT_FAMILY, color: "#000", border: "3pt solid #000", padding: 0 },
  headerBox: { backgroundColor: "#000", padding: "24pt 48pt 18pt 48pt" },
  name: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#fff", letterSpacing: 2, marginBottom: 8, ...LH(28) },
  role: { color: "#fff", marginBottom: 4, ...LH(12) },
  contact: { color: "#aaa", ...LH(9) },
  body: { padding: "18pt 48pt 36pt 48pt" },
  summaryLabel: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#000", border: "2pt solid #000", padding: "4pt 10pt", marginBottom: 4, ...LH(11) },
  summaryText: { color: "#333", border: "2pt solid #000", padding: "10pt 14pt", marginBottom: 8, ...LH(10) },
  section: { marginTop: 12 },
  sectionTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#000", border: "2pt solid #000", padding: "4pt 10pt", marginBottom: 6, ...LH(11) },
  entry: { marginBottom: 8, borderLeft: "3pt solid #000", paddingLeft: 12 },
  entryTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#000", marginBottom: 2, ...LH(10.5) },
  entrySub: { color: "#666", marginBottom: 2, ...LH(8.5) },
  bullet: { color: "#333", marginBottom: 2, paddingLeft: 6, ...LH(10) },
  skillsText: { color: "#333", ...LH(10) },
  eduBlock: { marginTop: 12, borderTop: "3pt solid #000", paddingTop: 8 },
  eduTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#000", marginBottom: 2, ...LH(10.5) },
  eduSub: { color: "#666", ...LH(9) },
};

export default function TemplateBrutalist({ finalResume: data }: TemplateProps) {
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
          <View><Text style={S.summaryLabel}>SUMMARY</Text><Text style={S.summaryText}>{data.summary || ""}</Text></View>
          {f.map((s, si) => (<View key={si} style={S.section}><Text style={S.sectionTitle}>{s.label}</Text>{s.entries.map((e, ei) => (<View key={ei} style={S.entry}><Text style={S.entryTitle}>{e.title}</Text>{e.subtitle ? <Text style={S.entrySub}>{e.subtitle}</Text> : null}{e.bullets.map((b, bi) => (<Text key={bi} style={S.bullet}>{"▸"} {b}</Text>))}</View>))}</View>))}
          {data.skills && data.skills.length > 0 ? (<View style={S.section}><Text style={S.sectionTitle}>SKILLS</Text><Text style={S.skillsText}>{data.skills.join("  ·  ")}</Text></View>) : null}
          <View style={S.eduBlock}>{data.education && data.education.school ? (<><Text style={S.sectionTitle}>EDUCATION</Text><Text style={S.eduTitle}>{data.education.school}</Text><Text style={S.eduSub}>{data.education.degree}{data.education.year ? ` | ${data.education.year}` : ""}</Text></>) : null}</View>
        </View>
      </Page>
    </Document>
  );
}
