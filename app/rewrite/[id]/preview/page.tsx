"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { FinalResume } from "@/lib/types";
import type { ResumeTemplate } from "@/lib/resume-templates";
import { TEMPLATES, getTemplate } from "@/lib/resume-templates";
import { Font } from "@react-pdf/renderer";
import ResumePdfDocument from "@/components/resume-pdf-document";

const BlobProvider = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.BlobProvider),
  { ssr: false }
);

export default function ResumePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [finalResume, setFinalResume] = useState<FinalResume | null>(null);
  const [selectedId, setSelectedId] = useState("ai-pm");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`${id}_rewrite`);
    if (stored) {
      try {
        const result = JSON.parse(stored);
        if (result.finalResume) {
          setFinalResume(result.finalResume);
        } else {
          // Old data format — need to re-run rewrite
          setFinalResume(null);
        }
      } catch {}
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    try {
      Font.register({
        family: "Noto Sans SC",
        fonts: [{ src: "/fonts/NotoSansSC.otf" }],
      });
    } catch {}
  }, []);

  const selectedTemplate = getTemplate(selectedId);

  const handleDownload = useCallback(async () => {
    if (!finalResume) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalResume, template: selectedId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${selectedId}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [finalResume, selectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-gray-700 rounded-full" />
      </div>
    );
  }

  if (!finalResume) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="text-center max-w-sm">
          <p className="text-gray-700 text-sm font-medium mb-2">简历数据不可用</p>
          <p className="text-gray-400 text-xs mb-5 leading-relaxed">
            请返回优化结果页，重新点击「AI 改写简历」生成最新版本。如果仍不行，请重新上传简历并完成分析→改写流程。
          </p>
          <button
            onClick={() => router.push(`/rewrite/${id}`)}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            返回优化结果
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Top bar — minimal, document-editor style */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push(`/rewrite/${id}`)}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs font-medium text-gray-900">Resume Preview</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Template switcher — cleaner design */}
          <div className="flex items-center gap-3">
            {TEMPLATES.map((t: ResumeTemplate) => (
              <label
                key={t.id}
                className={`text-xs cursor-pointer transition-colors ${
                  selectedId === t.id
                    ? "text-gray-900 font-medium"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedId === t.id}
                  onChange={() => setSelectedId(t.id)}
                  className="sr-only"
                />
                {t.name}
              </label>
            ))}
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {downloading ? (
              <>
                <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document canvas — full A4 page rendering, page-level scroll */}
      <div className="py-10 flex justify-center">
        <BlobProvider
          document={<ResumePdfDocument finalResume={finalResume} template={selectedTemplate} />}
        >
          {({ url, loading: pdfLoading, error: pdfError }) =>
            pdfLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-gray-700 rounded-full" />
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center max-w-sm">
                  <p className="text-gray-700 text-sm font-medium mb-2">PDF 预览生成失败</p>
                  <p className="text-gray-400 text-xs mb-4">请返回优化结果页重试</p>
                  <button
                    onClick={() => router.push(`/rewrite/${id}`)}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    返回优化结果
                  </button>
                </div>
              </div>
            ) : url ? (
              <iframe
                src={url}
                className="border-0 bg-white shadow-lg"
                style={{
                  width: 794,
                  minHeight: 1123,
                }}
                title="Resume PDF Preview"
              />
            ) : null
          }
        </BlobProvider>
      </div>
    </div>
  );
}
