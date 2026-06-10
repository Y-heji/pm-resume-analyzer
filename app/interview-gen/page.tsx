"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { recommendSkills } from "@/lib/skill-library";

type Stage = "BASIC_INFO" | "CAREER_TARGET" | "EXPERIENCE" | "PROJECTS" | "SKILLS" | "DONE";

const STAGE_LABELS: Record<string, string> = {
  BASIC_INFO: "基本信息",
  CAREER_TARGET: "职业定位",
  EXPERIENCE: "经历挖掘",
  PROJECTS: "项目经历",
  SKILLS: "技能证书",
  DONE: "完成",
};

const STAGES: Stage[] = ["BASIC_INFO", "CAREER_TARGET", "EXPERIENCE", "PROJECTS", "SKILLS"];

export default function InterviewGenPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("BASIC_INFO");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage data
  const [basicInfo, setBasicInfo] = useState<Record<string, string>>({});
  const [careerTarget, setCareerTarget] = useState<Record<string, string>>({});
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState({ hardSkills: [] as string[], certificates: "", languages: "" });

  // Experience sub-state
  const [currentExp, setCurrentExp] = useState({ company: "", role: "", duration: "", description: "" });
  const [currentProject, setCurrentProject] = useState({ name: "", background: "", role: "", tools: "", results: "" });
  const [followups, setFollowups] = useState<string[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);

  // AI messages
  const [aiMessage, setAiMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generated results
  const [resume, setResume] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [tabIdx, setTabIdx] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/interview-gen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const d = await r.json();
      setSessionId(d.sessionId);
      setAiMessage(d.message);
      setStage("BASIC_INFO");
    } catch { setError("初始化失败"); }
    finally { setLoading(false); }
  };

  const callApi = async (action: string, data: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/interview-gen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sessionId, ...data }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      return d;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally { setLoading(false); }
  };

  const nextStage = async (stageData: any) => {
    const d = await callApi("next", { stage, data: stageData });
    if (!d) return;
    if (d.done) {
      setStage("SKILLS");
      setAiMessage("信息齐了！AI 正在生成你的简历...");
      handleGenerate();
      return;
    }
    if (d.stage) setStage(d.stage);
    if (d.message) setAiMessage(d.message);
    if (d.suggestions) setSuggestions(d.suggestions);
  };

  const handleGenerate = async () => {
    const d = await callApi("generate");
    if (!d) return;
    setResume(d.resume);
    setRecommendations(d.recommendations);
    setStage("DONE");
    setAiMessage("简历已生成！你可以继续优化或导出。");
  };

  const handleFollowup = async () => {
    if (!currentExp.description.trim()) return;
    setFollowupLoading(true);
    try {
      const r = await fetch("/api/interview-gen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "followup", sessionId, description: currentExp.description, context: "工作" }),
      });
      const d = await r.json();
      setFollowups(d.questions || []);
    } catch { setFollowups([]); }
    finally { setFollowupLoading(false); }
  };

  const handleBack = async () => {
    const d = await callApi("back");
    if (!d) return;
    if (d.stage) setStage(d.stage);
    if (d.session) {
      setBasicInfo(d.session.basicInfo || {});
      setCareerTarget(d.session.careerTarget || {});
      setExperiences(d.session.experiences || []);
      setProjects(d.session.projects || []);
      setSkills(d.session.skills || { hardSkills: [], certificates: "", languages: "" });
    }
  };

  const addExperience = () => {
    if (!currentExp.company || !currentExp.description) return;
    const newExp = { ...currentExp, id: experiences.length, followups: [], completed: true };
    setExperiences([...experiences, newExp]);
    setCurrentExp({ company: "", role: "", duration: "", description: "" });
    setFollowups([]);
  };

  const addProject = () => {
    if (!currentProject.name) return;
    const newProj = { ...currentProject, id: projects.length, followups: [], completed: true };
    setProjects([...projects, newProj]);
    setCurrentProject({ name: "", background: "", role: "", tools: "", results: "" });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessage, followups]);

  if (loading && !sessionId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">AI 职业师正在准备...</p>
      </div>
    );
  }

  // ─── DONE: Show resume + recommendations ───
  if (stage === "DONE" && resume) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">你的简历已生成</h1>
        <p className="text-sm text-gray-500 mb-6">AI 职业访谈完成 · 下面是你和 AI 一起完成的简历</p>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 bg-gray-100 rounded-lg p-1">
          {["简历预览", "岗位推荐"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setTabIdx(i)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tabIdx === i ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {i === 0 ? "📄 " : "🎯 "}{tab}
            </button>
          ))}
        </div>

        {tabIdx === 0 ? (
          <ResumeView resume={resume} />
        ) : (
          <RecommendationView recommendations={recommendations} />
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={() => router.push(`/rewrite/${sessionId}`)}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            ✏️ 进入 AI 简历优化
          </button>
          <button onClick={startSession}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm">
            重新开始
          </button>
        </div>
      </div>
    );
  }

  // ─── Progress bar ───
  const currentStep = STAGES.indexOf(stage);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">AI 职业访谈</h1>
          <span className="text-xs text-gray-400">{currentStep + 1} / 5</span>
        </div>
        {/* Progress */}
        <div className="flex gap-2 mb-3">
          {STAGES.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-blue-600" : "bg-gray-200"
            }`} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          {STAGES.map((s, i) => (
            <span key={s} className={i <= currentStep ? "text-blue-600 font-medium" : ""}>
              {STAGE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* AI message */}
      {aiMessage && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
          <div className="flex gap-3">
            <span className="text-xl">🤖</span>
            <p className="text-sm text-gray-800">{aiMessage}</p>
          </div>
        </div>
      )}

      {/* Stage-specific content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        {stage === "BASIC_INFO" && (
          <StageBasicInfo data={basicInfo} onChange={setBasicInfo} />
        )}
        {stage === "CAREER_TARGET" && (
          <StageCareerTarget data={careerTarget} onChange={setCareerTarget} suggestions={suggestions} basicInfo={basicInfo} />
        )}
        {stage === "EXPERIENCE" && (
          <StageExperience
            current={currentExp} onChange={setCurrentExp} onAdd={addExperience}
            experiences={experiences} followups={followups}
            onFollowup={handleFollowup} followupLoading={followupLoading}
          />
        )}
        {stage === "PROJECTS" && (
          <StageProjects current={currentProject} onChange={setCurrentProject} onAdd={addProject} projects={projects} />
        )}
        {stage === "SKILLS" && (
          <StageSkills skills={skills} onChange={setSkills} targetRole={careerTarget.role || ""} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button onClick={handleBack} disabled={loading}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
            ← 上一步
          </button>
        )}
        <button onClick={() => {
          if (stage === "BASIC_INFO") nextStage(basicInfo);
          else if (stage === "CAREER_TARGET") nextStage(careerTarget);
          else if (stage === "EXPERIENCE") {
            if (experiences.length === 0 && !currentExp.company) {
              setError("请至少添加一段经历"); return;
            }
            if (currentExp.company) addExperience();
            nextStage({ experiences, finished: true });
          } else if (stage === "PROJECTS") {
            if (currentProject.name) addProject();
            nextStage({ projects, finished: true });
          } else if (stage === "SKILLS") {
            nextStage(skills);
          }
        }} disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
          {loading ? "处理中..." : stage === "SKILLS" ? "🎉 生成简历" : stage === "PROJECTS" ? "继续 →" : "保存并继续 →"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <div ref={chatEndRef} />
    </div>
  );
}

// ─── Stage Components ────────────────────────────────────────

function StageBasicInfo({ data, onChange }: { data: Record<string, string>; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-4">📋 基本信息</h3>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="姓名" value={data.name || ""} onChange={v => onChange({ ...data, name: v })} placeholder="你的真实姓名" />
        <SelectField label="学历" value={data.degree || ""} onChange={v => onChange({ ...data, degree: v })} options={["本科", "硕士", "博士", "大专"]} />
        <InputField label="学校" value={data.school || ""} onChange={v => onChange({ ...data, school: v })} placeholder="如：北京大学" />
        <InputField label="专业" value={data.major || ""} onChange={v => onChange({ ...data, major: v })} placeholder="如：计算机科学" />
        <InputField label="毕业时间" value={data.graduation || ""} onChange={v => onChange({ ...data, graduation: v })} placeholder="如：2026.07" />
        <SelectField label="求职状态" value={data.status || ""} onChange={v => onChange({ ...data, status: v })} options={["应届生求职", "在职看机会", "已离职求职中", "转行"]} />
      </div>
    </div>
  );
}

function StageCareerTarget({ data, onChange, suggestions, basicInfo }: {
  data: Record<string, string>; onChange: (v: any) => void; suggestions: string[]; basicInfo: Record<string, string>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-4">🎯 职业定位</h3>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="意向岗位" value={data.role || ""} onChange={v => onChange({ ...data, role: v })} placeholder="如：产品经理" />
        <InputField label="意向行业" value={data.industry || ""} onChange={v => onChange({ ...data, industry: v })} placeholder="如：互联网" />
        <InputField label="意向城市" value={data.city || ""} onChange={v => onChange({ ...data, city: v })} placeholder="如：北京" />
        <InputField label="薪资期望" value={data.salary || ""} onChange={v => onChange({ ...data, salary: v })} placeholder="如：8k-12k" />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-700 mb-2">🤖 根据你的 {basicInfo.major || ""} 专业推荐：</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((r, i) => (
              <button key={i} onClick={() => onChange({ ...data, role: r })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  data.role === r ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}>
                {r} {i === 0 ? "⭐" : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StageExperience({ current, onChange, onAdd, experiences, followups, onFollowup, followupLoading }: any) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-4">💼 经历挖掘</h3>
      <p className="text-xs text-gray-500 mb-3">没有实习的话，校园/社团经历也可以。AI 会帮你追问细节。</p>

      <div className="grid grid-cols-3 gap-2">
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="公司/组织"
          value={current.company} onChange={e => onChange({ ...current, company: e.target.value })} />
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="岗位"
          value={current.role} onChange={e => onChange({ ...current, role: e.target.value })} />
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="时间范围"
          value={current.duration} onChange={e => onChange({ ...current, duration: e.target.value })} />
      </div>
      <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={3}
        placeholder="你负责什么？做了什么？结果如何？（越具体越好）"
        value={current.description} onChange={e => onChange({ ...current, description: e.target.value })} />

      {/* AI Followup trigger */}
      {current.description.trim().length > 10 && (
        <button onClick={onFollowup} disabled={followupLoading}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {followupLoading ? "AI 追问生成中..." : "🤖 AI 追问 · STAR 补全"}
        </button>
      )}

      {/* Followup display */}
      {followups.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 space-y-2">
          {followups.map((q: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-yellow-800">
              <span className="text-xs mt-0.5">💡</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAdd} disabled={!current.company || !current.description}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30">
        + 添加这段经历
      </button>

      {/* Already added */}
      {experiences.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-gray-400">已添加 {experiences.length} 段经历</p>
          {experiences.map((e: any) => (
            <div key={e.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
              📌 {e.company} · {e.role} · {e.duration}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StageProjects({ current, onChange, onAdd, projects }: any) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-4">📁 项目经历</h3>
      <p className="text-xs text-gray-500 mb-3">课程设计、比赛项目、个人作品都可以。</p>

      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="项目名称"
        value={current.name} onChange={e => onChange({ ...current, name: e.target.value })} />
      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="项目背景（一句话）"
        value={current.background} onChange={e => onChange({ ...current, background: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="你的角色"
          value={current.role} onChange={e => onChange({ ...current, role: e.target.value })} />
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="使用的工具/技术"
          value={current.tools} onChange={e => onChange({ ...current, tools: e.target.value })} />
      </div>
      <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={2}
        placeholder="项目成果（越具体越好）"
        value={current.results} onChange={e => onChange({ ...current, results: e.target.value })} />

      <button onClick={onAdd} disabled={!current.name}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30">
        + 添加这个项目
      </button>

      {projects.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-gray-400">已添加 {projects.length} 个项目</p>
          {projects.map((p: any) => (
            <div key={p.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
              📁 {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StageSkills({ skills, onChange, targetRole }: {
  skills: any; onChange: (v: any) => void; targetRole: string;
}) {
  const recommended = targetRole ? recommendSkills(targetRole) : [];
  const currentSkills = skills.hardSkills || [];

  const toggleSkill = (skill: string) => {
    if (currentSkills.includes(skill)) {
      onChange({ ...skills, hardSkills: currentSkills.filter((s: string) => s !== skill) });
    } else {
      onChange({ ...skills, hardSkills: [...currentSkills, skill] });
    }
  };

  const allSkills = [...new Set([...currentSkills, ...recommended])];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 mb-4">🛠️ 技能 & 证书</h3>

      {/* Skills tagging */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">✅ 你的技能（点击增删）</p>
        <div className="flex flex-wrap gap-2">
          {allSkills.map(skill => (
            <button key={skill} onClick={() => toggleSkill(skill)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentSkills.includes(skill)
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-500 border border-dashed border-gray-300"
              }`}>
              {skill} {currentSkills.includes(skill) ? "" : "+"}
            </button>
          ))}
        </div>
      </div>

      {/* Gap warning */}
      {targetRole && targetRole.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-yellow-800 mb-2">
            💡 {targetRole} 岗位通常还需要以下能力（仅供参考）：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommended.filter(s => !currentSkills.includes(s)).map(skill => (
              <span key={skill} className="px-2 py-0.5 bg-yellow-100 rounded-full text-xs text-yellow-700">
                {skill} · 建议补充
              </span>
            ))}
          </div>
          <p className="text-[10px] text-yellow-600 mt-2">不需要全部满足，这只是方向参考。</p>
        </div>
      )}

      {/* Certificates & Languages */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">证书</label>
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：CET-6 · PMP"
            value={skills.certificates} onChange={e => onChange({ ...skills, certificates: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">语言能力</label>
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：英语流利 · 雅思7.0"
            value={skills.languages} onChange={e => onChange({ ...skills, languages: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// ─── Reusable form fields ────────────────────────────────────

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value} onChange={e => onChange(e.target.value)}>
        <option value="">请选择</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Done screen components ──────────────────────────────────

function ResumeView({ resume }: { resume: any }) {
  if (!resume) return <p className="text-sm text-gray-400">简历生成中...</p>;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      {/* Self evaluation */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">自我评价</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{resume.selfEvaluation}</p>
      </section>
      {/* Education */}
      {resume.education?.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-2">教育经历</h3>
          {resume.education.map((e: any, i: number) => (
            <p key={i} className="text-sm text-gray-700">{e.school} · {e.major} · {e.degree} · {e.time}</p>
          ))}
        </section>
      )}
      {/* Experiences */}
      {resume.experiences?.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-2">实习/工作经历</h3>
          {resume.experiences.map((e: any, i: number) => (
            <div key={i} className="mb-3">
              <p className="text-sm font-semibold text-gray-800">{e.company} · {e.title}</p>
              <p className="text-xs text-gray-400 mb-1">{e.time}</p>
              <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                {e.bullets?.map((b: string, j: number) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {/* Projects */}
      {resume.projects?.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-2">项目经历</h3>
          {resume.projects.map((p: any, i: number) => (
            <div key={i} className="mb-2 text-sm text-gray-700">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-gray-400">{p.role} · {p.tools}</p>
              <ul className="list-disc pl-4 text-sm text-gray-700">
                {p.results?.map((r: string, j: number) => <li key={j}>{r}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {/* Skills */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">技能 & 证书</h3>
        <div className="flex flex-wrap gap-1.5">
          {resume.skills?.map((s: string, i: number) => (
            <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{s}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">{resume.certificates?.join(" · ")}</p>
      </section>
    </div>
  );
}

function RecommendationView({ recommendations }: { recommendations: any[] }) {
  if (!recommendations?.length) return <p className="text-sm text-gray-400">推荐生成中...</p>;
  return (
    <div className="space-y-3">
      {recommendations.map((r: any, i: number) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{i + 1}. {r.role} · {r.industry}</p>
            <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
            {r.gaps?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {r.gaps.map((g: string, j: number) => (
                  <span key={j} className="px-1.5 py-0.5 bg-yellow-50 rounded text-[10px] text-yellow-700">{g}</span>
                ))}
              </div>
            )}
          </div>
          <span className={`shrink-0 ml-3 px-3 py-1 rounded-full text-xs font-bold ${
            r.score >= 80 ? "bg-green-100 text-green-700" : r.score >= 60 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
          }`}>
            {r.score}%
          </span>
        </div>
      ))}
    </div>
  );
}
