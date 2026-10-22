"use client";

import { useState } from "react";

import { postApi, postApiBlob, saveBlob } from "@/lib/api";
import type { ImprovedLine, ImproveResult } from "@/lib/types";
import CopyButton from "./CopyButton";
import { useResume } from "./ResumeContext";

function toText(lines: ImprovedLine[]): string {
  return lines
    .map((line, i) => `${i + 1}. BEFORE: ${line.original}\n   AFTER:  ${line.improved}`)
    .join("\n\n");
}

export default function AutoImprove() {
  const { file, jobDescription } = useResume();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<ImprovedLine[]>([]);
  const [building, setBuilding] = useState(false);

  function resumeForm(): FormData {
    const form = new FormData();
    if (file) form.append("file", file);
    if (jobDescription.trim()) form.append("job_description", jobDescription.trim());
    return form;
  }

  async function improve() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postApi<ImproveResult>("/improve", resumeForm());
      setLines(result.lines);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadCv() {
    if (!file || building) return;
    setBuilding(true);
    setError(null);
    try {
      const form = resumeForm();
      // Reuse the rewrites already shown so the new CV matches them.
      if (lines.length) form.append("rewrites", JSON.stringify(lines));
      saveBlob(await postApiBlob("/improved-cv", form), "improved-resume.docx");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBuilding(false);
    }
  }

  function downloadText() {
    saveBlob(new Blob([toText(lines)], { type: "text/plain;charset=utf-8" }), "resume-improvements.txt");
  }

  return (
    <section className="card">
      <h2>Auto-improve my resume</h2>
      <p className="muted tool-hint">
        {file
          ? "AI finds the weakest lines in your resume and rewrites them. Replace placeholders like [X]% with your real numbers, then update your resume."
          : "Upload your resume above to find and fix its weak lines automatically."}
      </p>
      <div className="actions">
        <button className="primary" onClick={improve} disabled={!file || loading || building}>
          {loading ? "Finding weak lines…" : lines.length ? "Run again" : "Find & fix weak lines 🪄"}
        </button>
        <button className="secondary" onClick={downloadCv} disabled={!file || loading || building}>
          {building ? "Building your CV…" : "Download improved CV (.docx) 📄"}
        </button>
      </div>
      {building && (
        <p className="status" role="status">
          <span className="spinner" /> AI is rewriting your whole resume — this can take up to a
          minute…
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {lines.length > 0 && (
        <>
          <ol className="improvements">
            {lines.map((line) => (
              <li key={line.original}>
                <p className="before">
                  <span className="tag">Before</span>
                  {line.original}
                </p>
                <div className="after">
                  <p>
                    <span className="tag">After</span>
                    {line.improved}
                  </p>
                  <CopyButton text={line.improved} />
                </div>
                {line.reason && <p className="muted why">{line.reason}</p>}
              </li>
            ))}
          </ol>
          <div className="actions">
            <CopyButton text={toText(lines)} label="Copy all" />
            <button type="button" className="ghost" onClick={downloadText}>
              Download .txt
            </button>
          </div>
        </>
      )}
    </section>
  );
}
