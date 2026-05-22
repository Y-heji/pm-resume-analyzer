"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  onParsed: (text: string, fileName: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onParsed, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("请上传 PDF 格式的文件");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "PDF 解析失败");
      }

      const data = await response.json();
      setFileName(file.name);
      onParsed(data.text, file.name);
      track("resume_uploaded", { fileName: file.name, textLength: data.text.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${fileName ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}
          ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {loading ? (
          <div className="text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            正在解析 PDF...
          </div>
        ) : fileName ? (
          <div className="text-green-700">
            <div className="text-lg mb-1">✓ 已上传</div>
            <div className="text-sm">{fileName}</div>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="text-lg mb-1">拖拽简历 PDF 到此处</div>
            <div className="text-sm">或点击选择文件</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
