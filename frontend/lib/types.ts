export interface SectionScores {
  skills: number;
  experience: number;
  education: number;
  formatting: number;
}

export interface JobMatch {
  match_percentage: number;
  missing_keywords: string[];
}

export interface ResumeAnalysis {
  summary: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  ats_score: number;
  ats_reason: string;
  section_scores: SectionScores;
  suggestions: string[];
  job_match: JobMatch | null;
}

export type Language = "English" | "Roman Urdu" | "Urdu" | "Hindi";

export interface RewriteResult {
  options: string[];
}

export interface CoverLetterResult {
  cover_letter: string;
}

export interface ImprovedLine {
  original: string;
  improved: string;
  reason: string;
}

export interface ImproveResult {
  lines: ImprovedLine[];
}

export interface SkillGap {
  skill: string;
  priority: "High" | "Medium" | "Low";
  time_estimate: string;
  why: string;
  steps: string[];
  resources: string[];
}

export interface SkillRoadmap {
  target_role: string;
  summary: string;
  current_skills: string[];
  gaps: SkillGap[];
  total_time: string;
}
