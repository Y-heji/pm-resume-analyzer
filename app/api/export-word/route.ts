import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export async function POST(req: Request) {
  try {
    const { finalResume } = await req.json();

    if (!finalResume) {
      return NextResponse.json({ error: "缺少简历数据" }, { status: 400 });
    }

    const h = finalResume.header || {};
    const children: Paragraph[] = [];

    // Header
    children.push(
      new Paragraph({
        children: [new TextRun({ text: h.name || "", bold: true, size: 36 })],
        spacing: { after: 80 },
      })
    );
    if (h.role) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: h.role, size: 24, color: "555555" })],
          spacing: { after: 40 },
        })
      );
    }
    if (h.contact) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: h.contact, size: 20, color: "888888" })],
          spacing: { after: 200 },
        })
      );
    }

    // Summary
    if (finalResume.summary) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "个人总结", bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: finalResume.summary, size: 21 })],
          spacing: { after: 120 },
        })
      );
    }

    // Sections
    for (const sec of finalResume.sections || []) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: sec.label, bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
          border: { bottom: { style: "single", size: 1, color: "CCCCCC" } },
        })
      );
      for (const entry of sec.entries || []) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: entry.title, bold: true, size: 22 })],
            spacing: { after: 40 },
          })
        );
        if (entry.subtitle) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: entry.subtitle, size: 20, color: "888888" })],
              spacing: { after: 80 },
            })
          );
        }
        for (const b of entry.bullets || []) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${b}`, size: 21 })],
              spacing: { after: 60 },
              indent: { left: 360 },
            })
          );
        }
      }
    }

    // Skills
    if (finalResume.skills?.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "技能", bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: finalResume.skills.join(" · "),
              size: 21,
              color: "555555",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    // Education
    if (finalResume.education?.school) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "教育背景", bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: finalResume.education.school, bold: true, size: 22 })],
          spacing: { after: 40 },
        })
      );
      const eduDetail = [
        finalResume.education.degree,
        finalResume.education.year,
      ]
        .filter(Boolean)
        .join(" | ");
      children.push(
        new Paragraph({
          children: [new TextRun({ text: eduDetail, size: 20, color: "888888" })],
          spacing: { after: 120 },
        })
      );
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="resume-${Date.now()}.docx"`,
      },
    });
  } catch (err) {
    console.error("Word export error:", err);
    return NextResponse.json({ error: "Word 导出失败" }, { status: 500 });
  }
}
