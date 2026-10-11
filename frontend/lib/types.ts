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
