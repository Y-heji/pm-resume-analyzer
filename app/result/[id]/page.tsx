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

  const tabs = [
    { key: "ats", label: "ATS 风险", count: result.atsRisks.length },
    { key: "skills", label: "缺失技能", count: result.missingSkills.length },
    { key: "suggestions", label: "优化建议", count: result.resumeSuggestions.length },
    { key: "difficulty", label: "岗位难度", count: null },
    { key: "learning", label: "学习路径", count: result.learningPath.length },
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
      <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-100">
        <ScoreGauge score={result.matchScore} breakdown={result.matchScoreBreakdown} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabSwitch(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white text-blue-600 border border-b-white border-gray-200 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
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

      {/* CTA: AI Rewrite */}
      <RewriteCta onClick={handleRewrite} />

      {/* Actions */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push("/analyze")}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          再分析一个
        </button>
      </div>
    </div>
  );
}
