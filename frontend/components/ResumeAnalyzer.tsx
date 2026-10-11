"use client";

import { useRef, useState } from "react";

import { API_BASE, fileSizeError } from "@/lib/api";
import type { ResumeAnalysis } from "@/lib/types";
import ScoreRing from "./ScoreRing";

const SECTION_LABELS: Record<keyof ResumeAnalysis["section_scores"], string> = {
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  formatting: "Formatting",
};

async function readError(response: Response): Promise<string> {
  let detail = `Request failed (${response.status}).`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
  } catch {
    /* non-JSON error body */
  }
  return detail;
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(next: File | null) {
    if (!next) return;
    const problem = fileSizeError(next);
    setError(problem);
    setFile(problem ? null : next);
    setResult(null);
  }

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (jobDescription.trim()) form.append("job_description", jobDescription.trim());

      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setResult((await response.json()) as ResumeAnalysis);
    } catch {
      setError("Could not reach the API. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="analyzer">
      <section className="card">
        <div
          className={`dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <span className="dropzone-icon">PDF</span>
          {file ? (
            <p className="file-name">
              {file.name} <span className="muted">({(file.size / 1024).toFixed(0)} KB)</span>
            </p>
          ) : (
            <p className="muted">Drop your resume here, or click to browse (max 5 MB)</p>
          )}
        </div>

        <label className="field-label" htmlFor="jd">
          Job description <span className="muted">(optional, improves job-match scoring)</span>
        </label>
        <textarea
          id="jd"
          className="jd"
          rows={5}
          maxLength={20000}
          placeholder="Paste the job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <button className="primary" onClick={submit} disabled={!file || loading}>
          {loading ? "Analyzing…" : "Analyze resume"}
        </button>

        {loading && (
          <p className="status" role="status">
            <span className="spinner" /> Reading the PDF and asking the AI — this can take up to a
            minute…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

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
          <p className="summary">{data.summary}</p>
          <p className="muted reason">{data.ats_reason}</p>
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
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="card warn-card">
          <h2>Weaknesses</h2>
          <ul>
            {data.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Suggestions</h2>
        <ol>
          {data.suggestions.map((item) => (
            <li key={item}>{item}</li>
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
