"use client";

import { useState } from "react";
import type { JobRecommendation } from "@/lib/types";

const difficultyColor: Record<string, string> = {
  "入门": "bg-green-100 text-green-700",
  "中等": "bg-yellow-100 text-yellow-700",
  "困难": "bg-red-100 text-red-700",
};

const priorityStyle = {
  immediate: "bg-red-100 text-red-700",
  "short-term": "bg-yellow-100 text-yellow-700",
  "long-term": "bg-gray-100 text-gray-600",
};

const priorityLabel = {
  immediate: "立即",
  "short-term": "短期",
  "long-term": "长期",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function parseResource(resource: string) {
  const parts = resource.split(" - ").map((s) => s.trim());
  if (parts.length >= 3) {
    return {
      platform: parts[0],
      author: parts[1],
      course: parts[2],
      note: parts.slice(3).join(" · "),
    };
  }
  return { platform: "", author: "", course: resource, note: "" };
}

export default function RecommendedJobs({
  jobs,
  currentRole,
}: {
  jobs: JobRecommendation[];
  currentRole?: string;
}) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        根据你的简历，AI 推荐以下适合投递的岗位及对应的入行学习路径{currentRole ? `（当前岗位：${currentRole}）` : ""}：
      </p>
      {jobs.map((job, i) => (
        <JobCard key={i} job={job} index={i} />
      ))}
    </div>
  );
}

function JobCard({ job, index }: { job: JobRecommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasPath = job.learningPath && job.learningPath.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors overflow-hidden">
      <div
        className={`p-5 ${hasPath ? "cursor-pointer" : ""}`}
        onClick={() => hasPath && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
              {index + 1}
            </span>
            <span className="font-semibold text-gray-900">{job.roleTitle}</span>
            {hasPath && (
              <span className="text-xs text-gray-400">
                {expanded ? "▲ 收起" : "▼ 展开学习路径"}
              </span>
            )}
          </div>
          <span className={`text-lg font-bold ${scoreColor(job.matchScore)}`}>
            {job.matchScore}
            <span className="text-xs text-gray-400 font-normal"> 分</span>
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{job.reason}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">{job.typicalSalary}</span>
          <span className={`px-2 py-0.5 rounded-full ${difficultyColor[job.difficulty] || "bg-gray-100 text-gray-600"}`}>
            {job.difficulty}
          </span>
        </div>
      </div>

      {expanded && hasPath && (
        <div className="border-t border-gray-100 bg-gray-50 p-5">
          <p className="text-xs text-gray-400 mb-3 font-medium">入行学习路径</p>
          <div className="space-y-3">
            {job.learningPath
              .sort((a, b) => a.order - b.order)
              .map((step, si) => {
                const r = parseResource(step.resource);
                return (
                  <div key={si} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-300 text-blue-600 text-xs flex items-center justify-center font-medium shrink-0">
                        {step.order}
                      </div>
                      {si < job.learningPath.length - 1 && (
                        <div className="w-0.5 flex-1 bg-blue-200 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{step.skill}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityStyle[step.priority]}`}>
                          {priorityLabel[step.priority]} · {step.timeEstimate}
                        </span>
                      </div>
                      {r.platform ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-500 rounded">
                              {r.platform}
                            </span>
                            <span className="text-gray-500">
                              主讲：<span className="text-gray-700 font-medium">{r.author}</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-700">{r.course}</p>
                          {r.note && (
                            <p className="text-[11px] text-gray-400">{r.note}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">{step.resource}</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
