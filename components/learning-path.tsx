import type { LearningPathStep } from "@/lib/types";
import { track } from "@/lib/analytics";

const priorityMap = {
  immediate: { label: "立即", className: "bg-red-100 text-red-700", border: "border-l-red-500" },
  "short-term": { label: "短期", className: "bg-yellow-100 text-yellow-700", border: "border-l-yellow-500" },
  "long-term": { label: "长期", className: "bg-gray-100 text-gray-600", border: "border-l-gray-400" },
};

function parseResource(resource: string) {
  // Format: "平台 - 作者 - 课程名 - 说明"
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

export default function LearningPath({ steps }: { steps: LearningPathStep[] }) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-0">
      {sorted.map((step, i) => {
        const style = priorityMap[step.priority];
        const r = parseResource(step.resource);

        return (
          <div key={i} className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium shrink-0">
                {step.order}
              </div>
              {i < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 min-h-[20px]" />
              )}
            </div>
            <div className={`flex-1 pb-6 border-l-4 ${style.border} pl-4 -ml-4`}>
              <div
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => track("learning_path_click", { skill: step.skill, order: step.order, priority: step.priority })}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{step.skill}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${style.className}`}>
                    {style.label} · {step.timeEstimate}
                  </span>
                </div>

                {r.platform ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        {r.platform}
                      </span>
                      {r.author && (
                        <span className="text-gray-500">
                          主讲：<span className="text-gray-700 font-medium">{r.author}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{r.course}</p>
                    {r.note && (
                      <p className="text-xs text-gray-400">{r.note}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{step.resource}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
