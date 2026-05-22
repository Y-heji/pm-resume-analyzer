import type { DifficultyAnalysis } from "@/lib/types";

const levelColor: Record<string, string> = {
  "入门": "bg-green-100 text-green-700",
  "中等": "bg-yellow-100 text-yellow-700",
  "困难": "bg-orange-100 text-orange-700",
  "极难": "bg-red-100 text-red-700",
};

export default function DifficultyCard({
  analysis,
}: {
  analysis: DifficultyAnalysis;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">综合难度</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${levelColor[analysis.overallLevel] || "bg-gray-100 text-gray-700"}`}>
          {analysis.overallLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">竞争程度</span>
          <p className="font-medium mt-0.5">{analysis.competitionLevel}</p>
        </div>
        <div>
          <span className="text-gray-400">预估薪资</span>
          <p className="font-medium mt-0.5">{analysis.salaryRange}</p>
        </div>
      </div>

      <div>
        <span className="text-sm text-gray-400 block mb-2">面试重点</span>
        <div className="flex flex-wrap gap-2">
          {analysis.interviewFocus.map((item, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm text-gray-400 block mb-2">核心障碍</span>
        <ul className="space-y-1">
          {analysis.keyBarriers.map((barrier, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-red-400 mt-0.5">&#x2022;</span>
              {barrier}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
