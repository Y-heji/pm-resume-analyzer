import type { ATSRisk } from "@/lib/types";

const severityMap = {
  high: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", label: "高风险" },
  medium: { bg: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-500", text: "text-yellow-700", label: "中风险" },
  low: { bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", text: "text-blue-700", label: "低风险" },
};

export default function AtsRiskCard({ risk }: { risk: ATSRisk }) {
  const style = severityMap[risk.severity];

  return (
    <div className={`rounded-xl p-5 border ${style.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className="text-xs px-2 py-0.5 bg-white rounded-full border border-gray-200">
          {risk.category}
        </span>
        <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
      </div>
      <p className="text-sm text-gray-800 mb-2">{risk.description}</p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">建议：</span>
        {risk.suggestion}
      </p>
    </div>
  );
}
