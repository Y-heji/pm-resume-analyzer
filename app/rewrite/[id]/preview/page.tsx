"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FinalResume } from "@/lib/types";
import { renderHTML, getTemplateIds, getTemplateName } from "@/lib/pdf-html-renderer";

export default function ResumePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [finalResume, setFinalResume] = useState<FinalResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [templateId, setTemplateId] = useState("swiss");

  useEffect(() => {
    const stored = sessionStorage.getItem(`${id}_rewrite`);
    if (stored) {
      try {
        const result = JSON.parse(stored);
        if (result.finalResume) {
          setFinalResume(result.finalResume);
          setHtmlContent(renderHTML(result.finalResume, templateId));
        }
      } catch {}
    }
    setLoading(false);
  }, [id, templateId]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".export-menu")) setShowExportMenu(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showExportMenu]);

  const exportFile = useCallback(async (format: "pdf" | "word") => {
    setDownloading(true);
    setExportError(null);
    try {
      if (format === "pdf") {
        const res = await fetch("/api/export-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalResume, templateId }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "PDF导出失败"); }
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `resume-${Date.now()}.pdf`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const res = await fetch("/api/export-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalResume }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "导出失败"); }
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `resume-${Date.now()}.docx`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err: any) {
      setExportError(err.message);
    } finally {
      setDownloading(false);
    }
  }, [finalResume, templateId, htmlContent]);

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
          <p className="text-gray-400 text-xs mb-5">请返回优化结果页，重新运行 AI 改写。</p>
          <button
            onClick={() => router.push(`/rewrite/${id}`)}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
          >
            返回优化结果
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push(`/rewrite/${id}`)}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs font-medium text-gray-900">Resume Preview</span>

          <div className="flex items-center gap-1 ml-4">
            {getTemplateIds().map((tid) => (
              <button key={tid} onClick={() => setTemplateId(tid)} className={`text-[10px] px-2 py-1 rounded-md transition-colors ${templateId===tid?"bg-gray-900 text-white":"text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
                {getTemplateName(tid)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative export-menu">
            <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
              disabled={downloading}
              className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:opacity-40 flex items-center gap-1.5"
            >
              {downloading ? (
                <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => { exportFile("pdf"); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={() => { exportFile("word"); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Word (.docx)
                </button>
              </div>
            )}
            {exportError && (
              <p className="text-xs text-red-500 mt-1.5">{exportError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Document canvas — HTML iframe */}
      <div className="py-10 flex justify-center">
        {htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            className="border-0 bg-white shadow-lg"
            style={{ width: 794, minHeight: 1123 }}
            title="Resume Preview"
          />
        ) : (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-gray-700 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
