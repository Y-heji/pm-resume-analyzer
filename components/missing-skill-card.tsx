import type { MissingSkill } from "@/lib/types";

const importanceMap = {
  required: { label: "必需", className: "bg-red-100 text-red-700" },
  "nice-to-have": { label: "加分项", className: "bg-gray-100 text-gray-600" },
};

const levelMap: Record<string, string> = {
  "无经验": "bg-gray-100 text-gray-600",
  "了解": "bg-yellow-100 text-yellow-700",
  "熟练": "bg-green-100 text-green-700",
};

export default function MissingSkillCard({ skill }: { skill: MissingSkill }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between gap-4">
      <div>
        <span className="font-medium text-gray-900">{skill.skill}</span>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${importanceMap[skill.importance].className}`}>
          {importanceMap[skill.importance].label}
        </span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${levelMap[skill.yourCurrentLevel] || "bg-gray-100 text-gray-600"}`}>
        {skill.yourCurrentLevel}
      </span>
    </div>
  );
}
