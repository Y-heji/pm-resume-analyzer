export interface AnalysisRequest {
  resumeText: string;
  resumeFileName: string;
  jdText: string;
}

export interface ResumeDigest {
  name: string;
  yearsOfExperience: number;
  currentRole: string;
  topSkills: string[];
  education: string;
}

export interface JdDigest {
  companyName: string;
  roleTitle: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceRequirement: string;
  educationRequirement: string;
}

export interface ATSRisk {
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
  suggestion: string;
}

export interface MissingSkill {
  skill: string;
  importance: "required" | "nice-to-have";
  yourCurrentLevel: string;
}

export interface ResumeSuggestion {
  section: string;
  issue: string;
  improvedVersion: string;
}

export interface DifficultyAnalysis {
  overallLevel: string;
  competitionLevel: string;
  salaryRange: string;
  interviewFocus: string[];
  keyBarriers: string[];
}

export interface LearningPathStep {
  order: number;
  skill: string;
  resource: string;
  timeEstimate: string;
  priority: "immediate" | "short-term" | "long-term";
}

export interface JobRecommendation {
  roleTitle: string;
  matchScore: number;
  reason: string;
  typicalSalary: string;
  difficulty: string;
  learningPath: LearningPathStep[];
}

export type RewriteCategory =
  | "star"
  | "data"
  | "ats"
  | "keyword"
  | "growth"
  | "professional";

export interface ScoreImprovement {
  ats: number;
  professionalism: number;
  dataDriven: number;
}

export interface RewriteSection {
  sectionTitle: string;
  original: string;
  rewritten: string;
  reason: string;
  category: RewriteCategory;
}

export interface RewriteModule {
  sourceSection: string;
  sectionTitle: string;
  original: string;
  rewritten: string;
  optimizationReasons: string[];
  category: RewriteCategory;
  scoreImprovement: ScoreImprovement;
}

/** Complete structured resume — single source of truth for PDF rendering */
export interface ResumeEntry {
  title: string;
  subtitle?: string;
  bullets: string[];
}

export interface FinalResume {
  header: { name: string; role: string; contact: string };
  summary: string;
  sections: { label: string; entries: ResumeEntry[] }[];
  skills: string[];
  education: { school: string; degree: string; year?: string };
}

export interface RewriteResult {
  id: string;
  createdAt: string;
  summary: string;
  atsImprovement: number;
  matchScoreImprovement: number;
  aiPmMatchEnhancement: string;
  resumeDigest: ResumeDigest;
  jdDigest: JdDigest;
  sections: RewriteSection[];
  modules: RewriteModule[];
  finalResume: FinalResume;
  paidPreview?: RewriteModule; // single paid-quality comparison for free tier
}

export interface WaitlistEntry {
  email: string;
  jobDirection: string;
  jobStatus: string;
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  resumeDigest: ResumeDigest;
  jdDigest: JdDigest;
  matchScore: number;
  matchScoreBreakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
  };
  atsRisks: ATSRisk[];
  missingSkills: MissingSkill[];
  resumeSuggestions: ResumeSuggestion[];
  difficultyAnalysis: DifficultyAnalysis;
  learningPath: LearningPathStep[];
  recommendedJobs: JobRecommendation[];
}
