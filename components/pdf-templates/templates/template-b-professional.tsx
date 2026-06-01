import { Document, Page, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "../shared/fonts";
import type { TemplateProps } from "../types";

// ═══ Professional/Business Style ═══

const S = {
  page: { padding: "52pt 56pt 46pt 56pt", fontFamily: FONT_FAMILY, fontSize: 9.5, lineHeight: 1.65, color: "#1a1a1a" },

  // Centered header with thicker line
  header: { textAlign: "center" as const, marginBottom: 20 },
  name: { fontSize: 22, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 4, letterSpacing: 1 },
  role: { fontSize: 11, color: "#555", marginBottom: 6 },
  contact: { fontSize: 9, color: "#777" },
  divider: { borderBottom: "1.5pt solid #222", marginBottom: 18 },

  // Summary
  summaryLabel: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#222", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  summaryText: { fontSize: 9.5, color: "#333", lineHeight: 1.65, marginBottom: 3 },

  // Section
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#222", borderBottom: "1pt solid #ccc", paddingBottom: 3, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },

  // Entry — two-line title style
  entry: { marginBottom: 10 },
  entryTitle: { fontSize: 10, fontFamily: `${FONT_FAMILY}-Bold`, color: "#1a1a1a", marginBottom: 1 },
  entrySub: { fontSize: 8.5, color: "#888", marginBottom: 3 },
  bullet: { fontSize: 9.5, color: "#333", lineHeight: 1.65, marginBottom: 2, paddingLeft: 12 },

  // Skills
  skillsText: { fontSize: 9.5, color: "#444", lineHeight: 1.5 },

  // Education
  eduSection: { marginTop: 18 },
  eduTitle: { fontSize: 10, fontFamily: `${FONT_FAMILY}-Bold`, color: "#1a1a1a" },
  eduSub: { fontSize: 9, color: "#777" },
};

const A = {
  page: { padding: "52pt 56pt 46pt 56pt", fontFamily: FONT_FAMILY, fontSize: 9.5, color: "#1a1a1a" },
  title: { fontSize: 18, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", textAlign: "center" as const, marginBottom: 8 },
  subtitle: { fontSize: 9, color: "#888", textAlign: "center" as const, marginBottom: 18 },
  divider: { borderBottom: "1.5pt solid #222", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#222", marginBottom: 6 },
  label: { fontSize: 8, color: "#888", marginBottom: 3 },
  text: { fontSize: 9.5, color: "#333", lineHeight: 1.65, marginBottom: 3 },
  tag: { fontSize: 8.5, color: "#333", marginBottom: 2 },
};

export default function TemplateB({ finalResume: data, deepAnalysis: d }: TemplateProps) {
  const h = data.header || { name: "", role: "", contact: "" };

  return (
    <Document title={h.name || "Resume"}>
      <Page size="A4" style={S.page} wrap>
        {/* Centered header */}
        <View style={S.header}>
          <Text style={S.name}>{h.name || "姓名"}</Text>
          {h.role ? <Text style={S.role}>{h.role}</Text> : null}
          {h.contact ? <Text style={S.contact}>{h.contact}</Text> : null}
        </View>
        <View style={S.divider} />

        {/* Summary */}
        {data.summary ? (
          <View>
            <Text style={S.summaryLabel}>Professional Summary</Text>
            <Text style={S.summaryText}>{data.summary}</Text>
          </View>
        ) : null}

        {/* Sections */}
        {(data.sections || []).map((sec, si) => (
          <View key={si} style={S.section}>
            <Text style={S.sectionTitle}>{sec.label}</Text>
            {sec.entries.map((e, ei) => (
              <View key={ei} style={S.entry}>
                <Text style={S.entryTitle}>{e.title}</Text>
                {e.subtitle ? <Text style={S.entrySub}>{e.subtitle}</Text> : null}
                {e.bullets.map((b, bi) => (
                  <Text key={bi} style={S.bullet}>{"•"} {b}</Text>
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* Skills */}
        {data.skills?.length > 0 ? (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Skills</Text>
            <Text style={S.skillsText}>{data.skills.join("  ·  ")}</Text>
          </View>
        ) : null}

        {/* Education */}
        {data.education?.school ? (
          <View style={S.eduSection}>
            <Text style={S.sectionTitle}>Education</Text>
            <View style={S.entry}>
              <Text style={S.eduTitle}>{data.education.school}</Text>
              <Text style={S.eduSub}>{data.education.degree}{data.education.year ? `  |  ${data.education.year}` : ""}</Text>
            </View>
          </View>
        ) : null}
      </Page>

      {d ? (
        <Page size="A4" style={A.page} wrap>
          <Text style={A.title}>深度分析报告</Text>
          <Text style={A.subtitle}>AI 职业经理师 · 付费版专属</Text>
          <View style={A.divider} />
          {d.atsReport ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>ATS 匹配率：{d.atsReport.score}%</Text>
              {d.atsReport.missingKeywords?.length ? (<View><Text style={A.label}>缺失关键词</Text><Text style={A.text}>{d.atsReport.missingKeywords.join("  ·  ")}</Text></View>) : null}
              {d.atsReport.tips?.length ? (<View><Text style={A.label}>优化建议</Text>{d.atsReport.tips.map((t: string, i: number) => <Text key={i} style={A.text}>· {t}</Text>)}</View>) : null}
            </View>
          ) : null}
          {d.hrReview ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>HR 视角分析</Text>
              <Text style={{ ...A.text, color: "#555" }}>"{d.hrReview.impression}"</Text>
              {d.hrReview.strengths?.length ? (<View><Text style={{ ...A.label, color: "#16a34a", marginTop: 6 }}>优势</Text>{d.hrReview.strengths.map((s: string, i: number) => <Text key={i} style={A.text}>+ {s}</Text>)}</View>) : null}
              {d.hrReview.risks?.length ? (<View><Text style={{ ...A.label, color: "#c00", marginTop: 6 }}>风险点</Text>{d.hrReview.risks.map((r: string, i: number) => <Text key={i} style={A.text}>- {r}</Text>)}</View>) : null}
              {d.hrReview.interviewFocus?.length ? (<View><Text style={{ ...A.label, marginTop: 6 }}>面试可能追问</Text><Text style={A.tag}>{d.hrReview.interviewFocus.join("  ·  ")}</Text></View>) : null}
            </View>
          ) : null}
          {d.coreAdvantage ? (<View style={A.section}><Text style={A.sectionTitle}>核心差异化优势</Text><Text style={A.text}>{d.coreAdvantage}</Text></View>) : null}
          {d.personalizedAdvice ? (<View style={A.section}><Text style={A.sectionTitle}>个性化提升建议</Text><Text style={A.text}>{d.personalizedAdvice}</Text></View>) : null}
        </Page>
      ) : null}
    </Document>
  );
}
