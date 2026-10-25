"use client";

import { useState } from "react";

import { postApi } from "@/lib/api";
import { addHistory } from "@/lib/history";
import type { SkillRoadmap as Roadmap } from "@/lib/types";
import LanguageSelect from "./LanguageSelect";
import { useResume } from "./ResumeContext";
import ResumeInput from "./ResumeInput";

export default function SkillRoadmap() {
  const { file, jobDescription, language } = useResume();
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Roadmap | null>(null);

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (jobDescription.trim()) form.append("job_description", jobDescription.trim());
      if (targetRole.trim()) form.append("target_role", targetRole.trim());
      form.append("language", language);
      const roadmap = await postApi<Roadmap>("/skill-roadmap", form);
      setResult(roadmap);
      addHistory({ kind: "roadmap", fileName: file.name, result: roadmap });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="analyzer">
      <ResumeInput jdHint="optional, the roadmap will target this job">
        <label className="field-label" htmlFor="target-role">
          Target role <span className="muted">(optional, e.g. &ldquo;Backend Developer&rdquo;)</span>
        </label>
        <input
          id="target-role"
          className="select"
          maxLength={200}
          placeholder="Leave empty to let AI suggest your next role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />

        <LanguageSelect />

        <button className="primary" onClick={submit} disabled={!file || loading}>
          {loading ? "Building your roadmap…" : "Build my roadmap 🗺️"}
        </button>

        {loading && (
          <p className="status" role="status">
            <span className="spinner" /> Comparing your skills with the role — this can take up
            to a minute…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </ResumeInput>

      {result && <RoadmapResult data={result} />}
    </div>
  );
}

function searchUrl(resource: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(resource)}`;
}

export function RoadmapResult({ data }: { data: Roadmap }) {
  return (
    <div className="results">
      <section className="card">
        <h2>Your roadmap to {data.target_role}</h2>
        <p className="summary" dir="auto">{data.summary}</p>
        <p className="roadmap-total">
          Estimated time: <strong>{data.total_time}</strong>{" "}
          <span className="muted">(part-time)</span>
        </p>
        {data.current_skills.length > 0 && (
          <>
            <h3>Skills you already have</h3>
            <div className="chips">
              {data.current_skills.map((skill) => (
                <span className="chip" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <ol className="roadmap">
        {data.gaps.map((gap, i) => (
          <li className="card roadmap-step" key={gap.skill}>
            <div className="roadmap-head">
              <span className="step-number">{i + 1}</span>
              <h2>{gap.skill}</h2>
              <span className={`priority ${gap.priority.toLowerCase()}`}>{gap.priority}</span>
              <span className="muted roadmap-time">{gap.time_estimate}</span>
            </div>
            <p className="muted" dir="auto">{gap.why}</p>
            <ol className="roadmap-steps">
              {gap.steps.map((step) => (
                <li key={step} dir="auto">{step}</li>
              ))}
            </ol>
            {gap.resources.length > 0 && (
              <>
                <h3>Free resources</h3>
                <ul className="resources">
                  {gap.resources.map((resource) => (
                    <li key={resource}>
                      <a href={searchUrl(resource)} target="_blank" rel="noopener noreferrer">
                        {resource} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
