"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/types";
import { track } from "@/lib/analytics";
import ScoreGauge from "@/components/score-gauge";
import AtsRiskCard from "@/components/ats-risk-card";
import MissingSkillCard from "@/components/missing-skill-card";
import SuggestionCard from "@/components/suggestion-card";
import DifficultyCard from "@/components/difficulty-card";
import LearningPath from "@/components/learning-path";
import RecommendedJobs from "@/components/recommended-jobs";
import RewriteCta from "@/components/rewrite-cta";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ats");

  const id = params.id as string;

  useEffect(() => {
    // Try server-side first
    fetch(`/api/analysis/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(data => {
        setResult(data);
        // Sync to sessionStorage for downstream pages
        sessionStorage.setItem(id, JSON.stringify(data));
        track("result_page_view", { analysisId: id });
      })
      .catch(() => {
        // Fallback to sessionStorage
        const stored = sessionStorage.getItem(id);
        if (stored) {
          try {
            setResult(JSON.parse(stored));
            track("result_page_view", { analysisId: id });
          } catch {
            setError("结果数据损坏，请重新分析");
          }
        } else {
          setError("未找到分析结果，请重新分析");
        }
      });
  }, [id]);

  const handleTabSwitch = useCallback(
    (key: string) => {
      track("result_tab_switch", { tab: key });
      setActiveTab(key);
    },
    []
  );

  const handleRewrite = useCallback(() => {
    router.push(`/rewrite/${id}`);
  }, [router, id]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.push("/analyze")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重新分析
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  const deep = (result as any).deepAnalysis;
  const tabs = [
    { key: "ats", label: "ATS 风险", count: result.atsRisks.length || null },
    ...(deep ? [{ key: "deep", label: "深度分析", count: null as number | null }] : []),
    { key: "skills", label: "缺失技能", count: result.missingSkills.length || null },
    { key: "suggestions", label: "优化建议", count: result.resumeSuggestions.length || null },
    { key: "difficulty", label: "岗位难度", count: null as number | null },
    { key: "learning", label: "学习路径", count: result.learningPath.length || null },
    { key: "jobs", label: "推荐岗位", count: result.recommendedJobs?.length || 0 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">分析报告</h1>
        <p className="text-sm text-gray-500">
          {result.jdDigest.companyName} · {result.jdDigest.roleTitle}
          {" vs "}
          {result.resumeDigest.name} · {result.resumeDigest.currentRole}
        </p>
      </div>

      {/* Score */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <ScoreGauge score={result.matchScore} breakdown={result.matchScoreBreakdown} />
      </div>

      {/* Risk Summary Banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-amber-800 mb-2">简历诊断结果</h3>
            <div className="flex gap-3 flex-wrap text-sm">
              {result.matchScore < 70 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg font-medium text-xs">
                  ⚠ 匹配度偏低（{result.matchScore}分）
                </span>
              )}
              {result.atsRisks.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium text-xs">
                  📋 {result.atsRisks.length} 个ATS风险
                </span>
              )}
              {result.missingSkills.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium text-xs">
                  🔍 缺失 {result.missingSkills.length} 项关键技能
                </span>
              )}
              {result.resumeSuggestions.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium text-xs">
                  ✏ {result.resumeSuggestions.length} 条优化建议
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — always shown, free & paid same */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabSwitch(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-blue-600 border border-b-white border-gray-200 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "deep" && deep && (
          <div className="space-y-4">
            {deep.atsReport && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">ATS 深度报告 · 匹配率 {deep.atsReport.score}%</h3>
                <p className="text-xs text-gray-400 mb-1.5">缺失关键词</p>
                <div className="flex flex-wrap gap-1.5 mb-3">{deep.atsReport.missingKeywords?.map((k: string,i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{k}</span>)}</div>
                <p className="text-xs text-gray-400 mb-1.5">优化建议</p>
                {deep.atsReport.tips?.map((t: string,i: number) => <p key={i} className="text-sm text-gray-600 mb-1">· {t}</p>)}
              </div>
            )}
            {deep.hrReview && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-2">HR 视角分析</h3>
                <p className="text-sm text-gray-500 mb-3 italic">"{deep.hrReview.impression}"</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-emerald-500 mb-1">优势</p>{deep.hrReview.strengths?.map((s: string,i: number) => <p key={i} className="text-gray-600">+ {s}</p>)}</div>
                  <div><p className="text-xs text-red-400 mb-1">风险点</p>{deep.hrReview.risks?.map((r: string,i: number) => <p key={i} className="text-gray-600">- {r}</p>)}</div>
                </div>
                <p className="text-xs text-gray-400 mt-3 mb-1">面试可能追问</p>
                <div className="flex flex-wrap gap-1.5">{deep.hrReview.interviewFocus?.map((f: string,i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{f}</span>)}</div>
              </div>
            )}
            {deep.coreAdvantage && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2">核心差异化优势</h3>
                <p className="text-sm text-gray-700">{deep.coreAdvantage}</p>
              </div>
            )}
            {deep.personalizedAdvice && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                <h3 className="font-semibold text-gray-900 mb-2">个性化提升建议</h3>
                <p className="text-sm text-gray-700">{deep.personalizedAdvice}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "ats" && (
          <>
            {result.atsRisks.map((risk, i) => (
              <AtsRiskCard key={i} risk={risk} />
            ))}
            {result.atsRisks.length === 0 && (
              <p className="text-gray-400 text-center py-8">未检测到 ATS 风险</p>
            )}
          </>
        )}
        {activeTab === "skills" && (
          <>
            {result.missingSkills.map((skill, i) => (
              <MissingSkillCard key={i} skill={skill} />
            ))}
            {result.missingSkills.length === 0 && (
              <p className="text-gray-400 text-center py-8">技能完全匹配</p>
            )}
          </>
        )}
        {activeTab === "suggestions" && (
          <>
            {result.resumeSuggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} />
            ))}
            {result.resumeSuggestions.length === 0 && (
              <p className="text-gray-400 text-center py-8">暂无优化建议</p>
            )}
          </>
        )}
        {activeTab === "difficulty" && (
          <DifficultyCard analysis={result.difficultyAnalysis} />
        )}
        {activeTab === "learning" && (
          <LearningPath steps={result.learningPath} />
        )}
        {activeTab === "jobs" && (
          <RecommendedJobs
            jobs={result.recommendedJobs || []}
            currentRole={result.resumeDigest?.currentRole}
          />
        )}
      </div>

      {/* CTA: AI Rewrite (free) */}
      <RewriteCta onClick={handleRewrite} />

      {/* Bottom Actions */}
      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => router.push("/analyze")}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          再分析一个
        </button>
      </div>
    </div>
  );
}
