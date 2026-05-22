"use client";

interface Props {
  score: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
  };
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function scoreStroke(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#ca8a04";
  return "#dc2626";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-600";
  if (score >= 60) return "bg-yellow-600";
  return "bg-red-600";
}

function scoreLabel(score: number) {
  if (score >= 80) return "高度匹配";
  if (score >= 60) return "基本匹配";
  if (score >= 40) return "部分匹配";
  return "匹配度低";
}

export default function ScoreGauge({ score, breakdown }: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* Circular gauge */}
      <div className="relative w-36 h-36 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke="#e5e7eb" strokeWidth="10"
          />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={scoreStroke(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 327} 327`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-gray-500">{scoreLabel(score)}</span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="flex-1 space-y-4 w-full">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>技能匹配</span>
            <span className="font-medium">{breakdown.skillsMatch}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBg(breakdown.skillsMatch)}`}
              style={{ width: `${breakdown.skillsMatch}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>经验匹配</span>
            <span className="font-medium">{breakdown.experienceMatch}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBg(breakdown.experienceMatch)}`}
              style={{ width: `${breakdown.experienceMatch}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>学历匹配</span>
            <span className="font-medium">{breakdown.educationMatch}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBg(breakdown.educationMatch)}`}
              style={{ width: `${breakdown.educationMatch}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
