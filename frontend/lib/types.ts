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
