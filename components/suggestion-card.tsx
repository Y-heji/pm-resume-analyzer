import type { ResumeSuggestion } from "@/lib/types";

export default function SuggestionCard({
  suggestion,
}: {
  suggestion: ResumeSuggestion;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="text-xs text-gray-400 mb-2">{suggestion.section}</div>
      <div className="mb-3">
        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">问题</span>
        <p className="text-sm text-gray-700 mt-1">{suggestion.issue}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">优化为</span>
        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{suggestion.improvedVersion}</p>
      </div>
    </div>
  );
}
