import { Document, Page, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "../shared/fonts";
import type { TemplateProps } from "../types";

const BAR_BG = "#e8e8e8";
const LH = (fs: number) => ({ lineHeight: 1.6, fontSize: fs, hyphens: "none" });

const S = {
  page: { fontFamily: FONT_FAMILY, color: "#1a1a1a", flexDirection: "row" as const },
  sidebar: { width: "30%", backgroundColor: BAR_BG, padding: "28pt 18pt 32pt 20pt" },
  sideName: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 8, ...LH(16) },
  sideRole: { color: "#666", marginBottom: 8, ...LH(9) },
  sideContact: { color: "#999", lineHeight: 11, ...LH(8) },
  sideSection: { marginTop: 14 },
  sideSectionTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", borderBottom: "0.5pt solid #ccc", paddingBottom: 2, marginBottom: 4, ...LH(9) },
  sideText: { color: "#555", marginBottom: 2, ...LH(9) },
  sideSkill: { color: "#555", marginBottom: 2, ...LH(9) },
  main: { flex: 1, padding: "36pt 24pt 32pt 24pt" },
  summaryText: { color: "#666", marginBottom: 8, ...LH(10) },
  section: { marginTop: 12 },
  sectionTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", borderBottom: "0.5pt solid #ccc", paddingBottom: 2, marginBottom: 6, ...LH(10.5) },
  entry: { marginBottom: 8 },
  entryTitle: { fontFamily: `${FONT_FAMILY}-Bold`, color: "#1a1a1a", marginBottom: 2, ...LH(10) },
  entrySub: { color: "#999", marginBottom: 2, ...LH(8) },
  bullet: { color: "#555", marginBottom: 2, paddingLeft: 8, ...LH(10) },
};

export default function TemplateTwoCol({ finalResume: data }: TemplateProps) {
  const h = data.header || { name: "", role: "", contact: "" };
  const filtered = (data.sections || []).filter(s => !s.label.includes("评价") && !s.label.includes("总结") && !s.label.includes("教育") && !s.label.includes("学历") && !s.label.includes("学校"));
  return (
    <Document title={h.name || "Resume"}>
      <Page size="A4" style={S.page}>
        <View style={S.sidebar}>
          <View>
            <Text style={S.sideName}>{h.name || "姓名"}</Text>
            {h.role ? <Text style={S.sideRole}>{h.role}</Text> : null}
            {h.contact ? <Text style={S.sideContact}>{h.contact}</Text> : null}
          </View>
          {data.skills && data.skills.length > 0 ? (<View style={S.sideSection}><Text style={S.sideSectionTitle}>技能</Text>{data.skills.map((s, i) => <Text key={i} style={S.sideSkill}>{s}</Text>)}</View>) : null}
          {data.education && data.education.school ? (<View style={S.sideSection}><Text style={S.sideSectionTitle}>教育</Text><Text style={S.sideText}>{data.education.school}</Text><Text style={S.sideText}>{data.education.degree}{data.education.year ? ` · ${data.education.year}` : ""}</Text></View>) : null}
        </View>
        <View style={S.main}>
          {data.summary ? <View><Text style={S.summaryText}>{data.summary}</Text></View> : null}
          {filtered.map((sec, si) => (<View key={si} style={S.section}><Text style={S.sectionTitle}>{sec.label}</Text>{sec.entries.map((e, ei) => (<View key={ei} style={S.entry}><Text style={S.entryTitle}>{e.title}</Text>{e.subtitle ? <Text style={S.entrySub}>{e.subtitle}</Text> : null}{e.bullets.map((b, bi) => (<Text key={bi} style={S.bullet}>{"•"} {b}</Text>))}</View>))}</View>))}
        </View>
      </Page>
    </Document>
  );
}
