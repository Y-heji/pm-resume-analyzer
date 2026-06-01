import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { FinalResume } from "@/lib/types";

const FONT_FAMILY = "Noto Sans SC";

// ═══ Styles ════════════════════════════════════════════════════

const S = {
  page: {
    padding: "48pt 48pt 42pt 48pt",
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    lineHeight: 1.6,
    color: "#333",
  },
  // Header
  header: { textAlign: "center" as const, marginBottom: 18 },
  name: { fontSize: 20, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 4 },
  role: { fontSize: 10.5, color: "#555", marginBottom: 4 },
  contact: { fontSize: 9, color: "#888" },
  divider: { borderBottom: "1pt solid #e0e0e0", marginBottom: 16 },

  // Summary
  summaryLabel: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 5, borderBottom: "1pt solid #e8e8e8", paddingBottom: 2 },
  summaryText: { fontSize: 9.5, color: "#333", lineHeight: 1.6, marginBottom: 2 },

  // Section
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", borderBottom: "1pt solid #e8e8e8", paddingBottom: 2, marginBottom: 8 },

  // Entry
  entry: { marginBottom: 8 },
  entryTitle: {
    fontSize: 10,
    fontFamily: `${FONT_FAMILY}-Bold`,
    color: "#222",
    marginBottom: 1,
  },
  entrySub: { fontSize: 8.5, color: "#888", marginBottom: 3 },
  bullet: { fontSize: 9.5, color: "#333", lineHeight: 1.6, marginBottom: 1.5, paddingLeft: 12 },

  // Skills
  skillsText: { fontSize: 9.5, color: "#555", lineHeight: 1.5 },

  // Education
  eduTitle: { fontSize: 10, fontFamily: `${FONT_FAMILY}-Bold`, color: "#222" },
  eduSub: { fontSize: 9, color: "#888" },
};

// ═══ Component ══════════════════════════════════════════════════

interface DeepData {
  atsReport?: { score: number; missingKeywords?: string[]; tips?: string[] };
  hrReview?: { strengths?: string[]; risks?: string[]; interviewFocus?: string[]; impression?: string };
  coreAdvantage?: string;
  personalizedAdvice?: string;
}

interface Props {
  finalResume: FinalResume;
  deepAnalysis?: DeepData;
}

// Appendix page styles (conservative — avoids flexWrap/gap for compat)
const A = {
  page: { padding: "48pt 48pt 42pt 48pt", fontFamily: FONT_FAMILY, fontSize: 9.5, color: "#333" },
  title: { fontSize: 18, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", textAlign: "center" as const, marginBottom: 8 },
  subtitle: { fontSize: 9, color: "#888", textAlign: "center" as const, marginBottom: 18 },
  divider: { borderBottom: "1pt solid #e0e0e0", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: `${FONT_FAMILY}-Bold`, color: "#111", marginBottom: 6 },
  label: { fontSize: 8, color: "#888", marginBottom: 3 },
  text: { fontSize: 9.5, color: "#333", lineHeight: 1.6, marginBottom: 3 },
  tag: { fontSize: 8.5, color: "#333", marginBottom: 2 },
};

export default function ResumePdfDocument({ finalResume: data, deepAnalysis: d }: Props) {
  const h = data.header || { name: "", role: "", contact: "" };

  return (
    <Document title={h.name || "Resume"}>
      <Page size="A4" style={S.page} wrap>
        {/* ═══ HEADER ═══ */}
        <View style={S.header}>
          <Text style={S.name}>{h.name || "姓名"}</Text>
          {h.role ? <Text style={S.role}>{h.role}</Text> : null}
          {h.contact ? <Text style={S.contact}>{h.contact}</Text> : null}
        </View>
        <View style={S.divider} />

        {/* ═══ SUMMARY ═══ */}
        {data.summary ? (
          <View>
            <Text style={S.summaryLabel}>个人总结</Text>
            <Text style={S.summaryText}>{data.summary}</Text>
          </View>
        ) : null}

        {/* ═══ SECTIONS ═══ */}
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

        {/* ═══ SKILLS ═══ */}
        {data.skills?.length > 0 ? (
          <View style={S.section}>
            <Text style={S.sectionTitle}>技能</Text>
            <Text style={S.skillsText}>{data.skills.join("  ·  ")}</Text>
          </View>
        ) : null}

        {/* ═══ EDUCATION ═══ */}
        {data.education?.school ? (
          <View style={S.section}>
            <Text style={S.sectionTitle}>教育背景</Text>
            <View style={S.entry}>
              <Text style={S.eduTitle}>{data.education.school}</Text>
              <Text style={S.eduSub}>
                {data.education.degree}
                {data.education.year ? `  |  ${data.education.year}` : ""}
              </Text>
            </View>
          </View>
        ) : null}
      </Page>

      {/* ═══ Deep Analysis Appendix (only when deep) ═══ */}
      {d ? (
        <Page size="A4" style={A.page} wrap>
          <Text style={A.title}>深度分析报告</Text>
          <Text style={A.subtitle}>AI 职业经理师 · 付费版专属</Text>
          <View style={A.divider} />

          {d.atsReport ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>ATS 匹配率：{d.atsReport.score}%</Text>
              {d.atsReport.missingKeywords?.length ? (
                <View>
                  <Text style={A.label}>缺失关键词</Text>
                  <Text style={A.text}>{d.atsReport.missingKeywords.join("  ·  ")}</Text>
                </View>
              ) : null}
              {d.atsReport.tips?.length ? (
                <View>
                  <Text style={A.label}>优化建议</Text>
                  {d.atsReport.tips.map((t: string, i: number) => <Text key={i} style={A.text}>· {t}</Text>)}
                </View>
              ) : null}
            </View>
          ) : null}

          {d.hrReview ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>HR 视角分析</Text>
              <Text style={{ ...A.text, color: "#666" }}>"{d.hrReview.impression}"</Text>
              {d.hrReview.strengths?.length ? (
                <View>
                  <Text style={{ ...A.label, color: "#16a34a", marginTop: 6 }}>优势</Text>
                  {d.hrReview.strengths.map((s: string, i: number) => <Text key={i} style={A.text}>+ {s}</Text>)}
                </View>
              ) : null}
              {d.hrReview.risks?.length ? (
                <View>
                  <Text style={{ ...A.label, color: "#dc2626", marginTop: 6 }}>风险点</Text>
                  {d.hrReview.risks.map((r: string, i: number) => <Text key={i} style={A.text}>- {r}</Text>)}
                </View>
              ) : null}
              {d.hrReview.interviewFocus?.length ? (
                <View>
                  <Text style={{ ...A.label, marginTop: 6 }}>面试可能追问</Text>
                  <Text style={A.tag}>{d.hrReview.interviewFocus.join("  ·  ")}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {d.coreAdvantage ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>核心差异化优势</Text>
              <Text style={A.text}>{d.coreAdvantage}</Text>
            </View>
          ) : null}

          {d.personalizedAdvice ? (
            <View style={A.section}>
              <Text style={A.sectionTitle}>个性化提升建议</Text>
              <Text style={A.text}>{d.personalizedAdvice}</Text>
            </View>
          ) : null}
        </Page>
      ) : null}
    </Document>
  );
}
