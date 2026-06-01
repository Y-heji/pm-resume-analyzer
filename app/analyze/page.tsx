"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/file-upload";
import { jobDatabase, industries, searchJobs } from "@/lib/job-database";
import { track } from "@/lib/analytics";

const RESUME_CACHE_KEY = "cached_resume_text";
const RESUME_NAME_KEY = "cached_resume_name";

export default function AnalyzePage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // Load cached resume on client mount (avoids hydration mismatch)
  useEffect(() => {
    const cached = sessionStorage.getItem(RESUME_CACHE_KEY);
    if (cached) {
      setResumeText(cached);
      setResumeFileName(sessionStorage.getItem(RESUME_NAME_KEY) || null);
    }
    setResumeLoaded(true);
  }, []);
  const [jdText, setJdText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist parsed resume so user can switch JD without re-uploading
  useEffect(() => {
    if (resumeText) {
      sessionStorage.setItem(RESUME_CACHE_KEY, resumeText);
      sessionStorage.setItem(RESUME_NAME_KEY, resumeFileName || "");
    }
  }, [resumeText, resumeFileName]);
  const [showExamples, setShowExamples] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  const filteredJobs = useMemo(
    () => searchJobs(searchKeyword, selectedIndustry || undefined),
    [searchKeyword, selectedIndustry]
  );

  // Auto-recommend JD positions from resume content
  const recommendedFromResume = useMemo(() => {
    if (!resumeText) return [];
    const text = resumeText.toLowerCase();

    // Score every job against the resume text
    const scored = jobDatabase.map(job => {
      let score = 0;
      const jd = job.jd.toLowerCase();
      const title = job.title.toLowerCase();

      // Title keywords (split by common separators)
      const titleWords = title.split(/[\s\/·\-\(\)（）]+/).filter(w => w.length >= 2);
      for (const w of titleWords) {
        if (text.includes(w)) score += 8;
      }

      // Full job title match
      if (text.includes(title)) score += 20;

      // Industry match
      const ind = job.industry.replace(/.*[-/]/, "").toLowerCase();
      if (text.includes(ind)) score += 5;

      // JD keywords that appear in resume
      const jdWords = jd.replace(/[【】「」（）\d.k-wK-W\s]+/g, " ").split(/[\s,，、。；;：:！!？?]+/).filter(w => w.length >= 2);
      for (const w of jdWords) {
        if (text.includes(w)) score += 1;
      }

      // Seniority detection
      const years = text.match(/(\d+)[\s-]*年/);
      if (years) {
        const y = parseInt(years[1]);
        if (y <= 1 && (title.includes("实习") || title.includes("助理") || title.includes("初级") || title.includes("培训生") || title.includes("应届"))) score += 10;
        if (y >= 5 && (title.includes("高级") || title.includes("资深") || title.includes("总监") || title.includes("经理") || title.includes("负责人"))) score += 10;
        if (y >= 8 && (title.includes("总监") || title.includes("VP") || title.includes("首席") || title.includes("CTO") || title.includes("合伙人"))) score += 10;
      }

      return { job, score };
    });

    // Sort by score, deduplicate by title, return top 6
    const seen = new Set<string>();
    const results: typeof jobDatabase = [];
    scored.sort((a, b) => b.score - a.score);
    for (const { job, score } of scored) {
      if (score < 5) continue; // skip irrelevant
      const key = job.title;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(job);
        if (results.length >= 6) break;
      }
    }
    return results;
  }, [resumeText]);

  const isPaid = typeof window !== "undefined" && sessionStorage.getItem("unlocked") === "true";
  const abortRef = useRef<AbortController | null>(null);

  async function handleAnalyze() {
    if (!resumeText || !jdText.trim()) {
      setError("请上传简历并填写岗位 JD");
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText, deep: isPaid }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "分析失败");
      }

      const result = await response.json();
      sessionStorage.setItem(result.id, JSON.stringify(result));
      sessionStorage.setItem(`${result.id}_resume`, resumeText!);
      sessionStorage.setItem(`${result.id}_jd`, jdText);
      track("analysis_completed", {
        analysisId: result.id,
        matchScore: result.matchScore,
      });
      router.push(`/result/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请重试");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-8">开始分析</h2>

      <div className="space-y-8">
        {/* Step 1: Upload Resume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            步骤 1：上传简历（PDF）
          </label>
          <FileUpload
            onParsed={(text, name) => {
              setResumeText(text);
              setResumeFileName(name);
            }}
            disabled={analyzing}
          />
        </div>

        {/* Step 2: Paste JD */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              步骤 2：粘贴岗位 JD
            </label>
            <button
              onClick={() => {
                setShowExamples(!showExamples);
                if (!showExamples) {
                  setSearchKeyword("");
                  setSelectedIndustry("");
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showExamples ? "收起搜索" : "搜索热门岗位"}
            </button>
          </div>

          {showExamples && (
            <div className="mb-3 p-4 bg-gray-50 rounded-xl space-y-3">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="搜索岗位名称，如：产品经理、数据分析师..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Resume-based recommendations */}
              {recommendedFromResume.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-blue-600 mb-1.5">根据你的简历推荐</p>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {recommendedFromResume.map((job) => (
                      <button
                        key={`rec:${job.industry}:${job.title}`}
                        onClick={() => {
                          setJdText(`【${job.title} | ${job.salary}】\n${job.jd}`);
                          setShowExamples(false);
                        }}
                        className="text-xs px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-400 text-blue-700 transition-colors text-left"
                        title={job.jd}
                      >
                        <span className="font-medium">{job.title}</span>
                        <span className="text-orange-500 ml-1.5 text-[11px]">{job.salary}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-2" />
                </div>
              )}

              {/* Industry filter tags */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedIndustry("")}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    !selectedIndustry
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-500 hover:border-blue-300"
                  }`}
                >
                  全部
                </button>
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() =>
                      setSelectedIndustry(selectedIndustry === ind ? "" : ind)
                    }
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      selectedIndustry === ind
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-blue-300"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>

              {/* Job results */}
              <div className="flex gap-1.5 flex-wrap max-h-40 overflow-y-auto">
                {filteredJobs.length === 0 ? (
                  <p className="text-xs text-gray-400">未找到匹配的岗位，试试其他关键词</p>
                ) : (
                  filteredJobs.map((job) => (
                    <button
                      key={`${job.industry}:${job.title}`}
                      onClick={() => {
                        setJdText(`【${job.title} | ${job.salary}】\n${job.jd}`);
                        setShowExamples(false);
                      }}
                      className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-left"
                      title={job.jd}
                    >
                      <span className="font-medium">{job.title}</span>
                      <span className="text-orange-500 ml-1.5 text-[11px]">{job.salary}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Resume-based quick picks (client-only, when search panel closed) */}
          {resumeLoaded && !showExamples && recommendedFromResume.length > 0 && (
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-gray-400 shrink-0">根据简历推荐：</span>
              {recommendedFromResume.slice(0, 4).map((job) => (
                <button
                  key={`quick:${job.industry}:${job.title}`}
                  onClick={() => { setJdText(`【${job.title} | ${job.salary}】\n${job.jd}`); }}
                  className="text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                >
                  {job.title} <span className="text-orange-400">{job.salary}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mb-2">
            只写岗位名称也可以，AI 会根据行业通用要求分析。点上方「搜索热门岗位」快速找到目标岗位。
          </p>
          <textarea
            className="w-full h-48 p-4 border border-gray-300 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="例如：「C端产品经理」或「前端开发工程师，3年以上经验，精通React和TypeScript…」"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            disabled={analyzing}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing || !resumeText || !jdText.trim()}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              AI 分析中，约需 10 秒...
            </span>
          ) : (
            "开始分析"
          )}
        </button>

        {resumeText && (
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              查看解析的简历文本（{resumeFileName}）
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs whitespace-pre-wrap max-h-48 overflow-auto">
              {resumeText}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
