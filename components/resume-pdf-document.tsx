import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type { FinalResume } from "@/lib/types";
import type { ResumeTemplate } from "@/lib/resume-templates";

// ─── Single-column styles ─────────────────────────────────────

function singleStyles(t: ResumeTemplate) {
  const pad = t.spacing.pagePadding;
  return {
    page: {
      padding: `${pad}pt`,
      fontFamily: t.font.family,
      fontSize: t.font.sizes.body,
      fontWeight: t.font.weights.body,
      lineHeight: t.layout.lineHeight,
      color: t.colors.text,
    },
    header: { marginBottom: t.spacing.headerGap },
    name: {
      fontSize: t.font.sizes.name,
      fontWeight: t.font.weights.name,
      letterSpacing: -0.3,
      marginBottom: 3,
    },
    roleTitle: {
      fontSize: t.font.sizes.role,
      color: t.colors.text,
      fontWeight: 500,
      marginBottom: 5,
    },
    contactRow: {
      fontSize: t.font.sizes.small,
      color: t.colors.muted,
      lineHeight: 1.4,
    },
    sectionTitle: {
      fontSize: t.font.sizes.section,
      fontWeight: t.font.weights.section,
      letterSpacing: t.layout.sectionSpacing,
      borderBottom: `${t.layout.borderWidth}pt solid ${t.colors.border}`,
      paddingBottom: 2,
      marginBottom: 7,
      marginTop: t.spacing.sectionGap,
    },
    summaryText: {
      fontSize: t.font.sizes.body,
      lineHeight: t.layout.lineHeight,
      color: t.colors.text,
      marginBottom: 2,
    },
    entry: { marginBottom: t.spacing.entryGap },
    entryTitle: { fontSize: t.font.sizes.body, fontWeight: 600 },
    entrySub: { fontSize: t.font.sizes.small, color: t.colors.muted, marginBottom: 2 },
    bullet: {
      fontSize: t.font.sizes.body,
      lineHeight: t.layout.lineHeight,
      color: t.colors.text,
      marginBottom: t.spacing.bulletGap,
      paddingLeft: 12,
    },
    skillText: { fontSize: t.font.sizes.body, color: t.colors.muted, lineHeight: 1.5 },
  };
}

// ─── Split (premium) styles ───────────────────────────────────

function splitStyles(t: ResumeTemplate) {
  const sw = t.layout.sidebarWidth || 32;
  const cw = 100 - sw;
  return {
    page: {
      flexDirection: "row",
      fontFamily: t.font.family,
      fontSize: t.font.sizes.body,
      fontWeight: t.font.weights.body,
      lineHeight: t.layout.lineHeight,
      color: t.colors.text,
    },
    // ── Sidebar ──
    sidebar: {
      width: `${sw}%`,
      backgroundColor: t.colors.sidebarBg || "#1e1e1e",
      padding: "36pt 22pt 30pt 26pt",
    },
    sbName: {
      fontSize: t.font.sizes.name,
      fontWeight: t.font.weights.name,
      color: "#fff",
      marginBottom: 4,
    },
    sbRole: {
      fontSize: t.font.sizes.role,
      color: t.colors.accent || "#60a5fa",
      fontWeight: 500,
      marginBottom: 20,
    },
    sbSectionLabel: {
      fontSize: 8.5,
      fontWeight: 600,
      color: t.colors.accent || "#60a5fa",
      textTransform: "uppercase" as const,
      letterSpacing: 1.4,
      marginBottom: 7,
      marginTop: 16,
    },
    sbContactItem: {
      fontSize: 8,
      color: t.colors.sidebarText || "#d4d4d4",
      marginBottom: 4,
      lineHeight: 1.5,
    },
    sbSkillItem: {
      fontSize: 8.5,
      color: t.colors.sidebarText || "#d4d4d4",
      marginBottom: 5,
      lineHeight: 1.4,
    },
    // ── Content ──
    content: {
      width: `${cw}%`,
      padding: "36pt 30pt 30pt 26pt",
    },
    cSectionTitle: {
      fontSize: t.font.sizes.section,
      fontWeight: t.font.weights.section,
      letterSpacing: t.layout.sectionSpacing,
      borderBottom: `${t.layout.borderWidth}pt solid ${t.colors.border}`,
      paddingBottom: 2,
      marginBottom: 8,
      marginTop: t.spacing.sectionGap,
    },
    cSummary: {
      fontSize: t.font.sizes.body,
      lineHeight: t.layout.lineHeight + 0.05,
      color: t.colors.text,
      marginBottom: 4,
    },
    cEntry: { marginBottom: t.spacing.entryGap + 2 },
    cEntryTitle: { fontSize: t.font.sizes.body, fontWeight: 600 },
    cEntrySub: {
      fontSize: t.font.sizes.small,
      color: t.colors.muted,
      marginBottom: 4,
    },
    cBullet: {
      fontSize: t.font.sizes.body,
      lineHeight: t.layout.lineHeight,
      color: t.colors.text,
      marginBottom: t.spacing.bulletGap,
      paddingLeft: 12,
    },
    cEduTitle: { fontSize: t.font.sizes.body, fontWeight: 600 },
    cEduSub: { fontSize: t.font.sizes.small, color: t.colors.muted },
  };
}

// ─── Single Column Document ───────────────────────────────────

function SingleColumnResume({ data, t }: { data: FinalResume; t: ResumeTemplate }) {
  const s = singleStyles(t);
  const h = data.header || { name: "", role: "", contact: "" };

  return (
    <Page size="A4" style={s.page} wrap>
      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.name}>{h.name}</Text>
        {h.role ? <Text style={s.roleTitle}>{h.role}</Text> : null}
        {h.contact ? <Text style={s.contactRow}>{h.contact}</Text> : null}
      </View>

      {/* SUMMARY */}
      {data.summary ? (
        <View>
          <Text style={s.sectionTitle}>个人总结</Text>
          <Text style={s.summaryText}>{data.summary}</Text>
        </View>
      ) : null}

      {/* SECTIONS */}
      {(data.sections || []).map((sec, si) => (
        <View key={si}>
          <Text style={s.sectionTitle}>{sec.label}</Text>
          {sec.entries.map((e, ei) => (
            <View key={ei} style={s.entry}>
              <Text style={s.entryTitle}>{e.title}</Text>
              {e.subtitle ? <Text style={s.entrySub}>{e.subtitle}</Text> : null}
              {e.bullets.map((b, bi) => (
                <Text key={bi} style={s.bullet}>{"•"} {b}</Text>
              ))}
            </View>
          ))}
        </View>
      ))}

      {/* SKILLS */}
      {data.skills?.length > 0 ? (
        <View>
          <Text style={s.sectionTitle}>技能</Text>
          <Text style={s.skillText}>{data.skills.join("  ·  ")}</Text>
        </View>
      ) : null}

      {/* EDUCATION */}
      {data.education?.school ? (
        <View>
          <Text style={s.sectionTitle}>教育背景</Text>
          <View style={s.entry}>
            <Text style={s.entryTitle}>{data.education.school}</Text>
            <Text style={s.entrySub}>
              {data.education.degree}
              {data.education.year ? `  |  ${data.education.year}` : ""}
            </Text>
          </View>
        </View>
      ) : null}
    </Page>
  );
}

// ─── Split (Premium) Document ─────────────────────────────────

function SplitResume({ data, t }: { data: FinalResume; t: ResumeTemplate }) {
  const s = splitStyles(t);
  const h = data.header || { name: "", role: "", contact: "" };

  // Parse contact into items
  const contactItems = h.contact
    ? h.contact.split(/[·,，、]/).filter(Boolean).map((c) => c.trim())
    : [];

  return (
    <Page size="A4" style={s.page} wrap>
      {/* ═══ SIDEBAR ═══ */}
      <View style={s.sidebar}>
        <Text style={s.sbName}>{h.name}</Text>
        <Text style={s.sbRole}>{h.role}</Text>

        {/* Contact */}
        {contactItems.length > 0 ? (
          <>
            <Text style={s.sbSectionLabel}>Contact</Text>
            {contactItems.map((item, i) => (
              <Text key={i} style={s.sbContactItem}>{item}</Text>
            ))}
          </>
        ) : null}

        {/* Skills in sidebar */}
        {data.skills?.length > 0 ? (
          <>
            <Text style={s.sbSectionLabel}>Skills</Text>
            {data.skills.map((sk, i) => (
              <Text key={i} style={s.sbSkillItem}>{sk}</Text>
            ))}
          </>
        ) : null}

        {/* Education in sidebar */}
        {data.education?.school ? (
          <>
            <Text style={s.sbSectionLabel}>Education</Text>
            <Text style={{ fontSize: 8.5, color: t.colors.sidebarText || "#d4d4d4", marginBottom: 2 }}>
              {data.education.school}
            </Text>
            <Text style={{ fontSize: 7.5, color: t.colors.sidebarText || "#d4d4d4", opacity: 0.7 }}>
              {data.education.degree}
              {data.education.year ? `, ${data.education.year}` : ""}
            </Text>
          </>
        ) : null}
      </View>

      {/* ═══ MAIN CONTENT ═══ */}
      <View style={s.content}>
        {/* Summary */}
        {data.summary ? (
          <View>
            <Text style={s.cSectionTitle}>个人总结</Text>
            <Text style={s.cSummary}>{data.summary}</Text>
          </View>
        ) : null}

        {/* Sections (Experience, Projects) */}
        {(data.sections || []).map((sec, si) => (
          <View key={si}>
            <Text style={s.cSectionTitle}>{sec.label}</Text>
            {sec.entries.map((e, ei) => (
              <View key={ei} style={s.cEntry}>
                {/* Timeline dot + title */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 2 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: t.colors.accent || "#3b82f6",
                      marginTop: 4,
                      marginRight: 8,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cEntryTitle}>{e.title}</Text>
                    {e.subtitle ? <Text style={s.cEntrySub}>{e.subtitle}</Text> : null}
                  </View>
                </View>
                {/* Bullets after timeline dot */}
                {e.bullets.map((b, bi) => (
                  <Text key={bi} style={s.cBullet}>{"•"} {b}</Text>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  );
}

// ─── Router ────────────────────────────────────────────────────

interface Props {
  finalResume: FinalResume;
  template: ResumeTemplate;
}

export default function ResumePdfDocument({ finalResume, template }: Props) {
  return (
    <Document title={finalResume.header?.name || "Resume"}>
      {template.mode === "split" ? (
        <SplitResume data={finalResume} t={template} />
      ) : (
        <SingleColumnResume data={finalResume} t={template} />
      )}
    </Document>
  );
}
