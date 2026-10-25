"use client";

import { useState } from "react";

import { postApi } from "@/lib/api";
import type { Language, ResumeAnalysis } from "@/lib/types";
import { useResume } from "./ResumeContext";
import ResumeInput from "./ResumeInput";
import ScoreRing from "./ScoreRing";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "English", label: "English" },
  { value: "Roman Urdu", label: "Roman Urdu" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Hindi", label: "हिंदी (Hindi)" },
];

const SECTION_LABELS: Record<keyof ResumeAnalysis["section_scores"], string> = {
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  formatting: "Formatting",
};

export default function ResumeAnalyzer() {
  const { file, jobDescription, language, setLanguage } = useResume();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (jobDescription.trim()) form.append("job_description", jobDescription.trim());
      form.append("language", language);
      setResult(await postApi<ResumeAnalysis>("/analyze", form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="analyzer">
      <ResumeInput>
        <label className="field-label" htmlFor="language">
          Feedback language
        </label>
        <select
          id="language"
          className="select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button className="primary" onClick={submit} disabled={!file || loading}>
          {loading ? "Analyzing…" : "Analyze resume"}
        </button>

        {loading && (
          <p className="status" role="status">
            <span className="spinner" /> Reading your resume and asking the AI — this can take up to a
            minute…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </ResumeInput>

      {result && <Results data={result} />}
    </div>
  );
}

function Results({ data }: { data: ResumeAnalysis }) {
  return (
    <div className="results">
      <section className="card overview">
        <ScoreRing score={data.ats_score} />
        <div>
          <h2>ATS score</h2>
          <p className="summary" dir="auto">{data.summary}</p>
          <p className="muted reason" dir="auto">{data.ats_reason}</p>
        </div>
      </section>

      <section className="card">
        <h2>Section scores</h2>
        <div className="bars">
          {(Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((key) => {
            const value = data.section_scores[key];
            return (
              <div className="bar-row" key={key}>
                <span className="bar-label">{SECTION_LABELS[key]}</span>
                <div className="track">
                  <div
                    className={`fill${value >= 75 ? " good" : value >= 50 ? " mid" : " low"}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="bar-value">{value}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid-2">
        <section className="card good-card">
          <h2>Strengths</h2>
          <ul>
            {data.strengths.map((item) => (
              <li key={item} dir="auto">{item}</li>
            ))}
          </ul>
        </section>
        <section className="card warn-card">
          <h2>Weaknesses</h2>
          <ul>
            {data.weaknesses.map((item) => (
              <li key={item} dir="auto">{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Suggestions</h2>
        <ol>
          {data.suggestions.map((item) => (
            <li key={item} dir="auto">{item}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Skills found</h2>
        <div className="chips">
          {data.skills.map((skill) => (
            <span className="chip" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </section>

      {data.job_match && (
        <section className="card match">
          <div>
            <h2>Job match</h2>
            <p className="muted">Against the job description you provided</p>
          </div>
          <strong className="match-score">{data.job_match.match_percentage}%</strong>
          {data.job_match.missing_keywords.length > 0 && (
            <>
              <h3>Missing keywords</h3>
              <div className="chips">
                {data.job_match.missing_keywords.map((kw) => (
                  <span className="chip missing" key={kw}>
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
