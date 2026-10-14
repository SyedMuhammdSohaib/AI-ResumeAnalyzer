"use client";

import { useState } from "react";

import { postApi } from "@/lib/api";
import type { ImprovedLine, ImproveResult } from "@/lib/types";
import CopyButton from "./CopyButton";

function toText(lines: ImprovedLine[]): string {
  return lines
    .map((line, i) => `${i + 1}. BEFORE: ${line.original}\n   AFTER:  ${line.improved}`)
    .join("\n\n");
}

export default function AutoImprove({
  file,
  jobDescription,
}: {
  file: File | null;
  jobDescription: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<ImprovedLine[]>([]);

  async function improve() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (jobDescription.trim()) form.append("job_description", jobDescription.trim());
      const result = await postApi<ImproveResult>("/improve", form);
      setLines(result.lines);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([toText(lines)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-improvements.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <h2>Auto-improve my resume</h2>
      <p className="muted tool-hint">
        {file
          ? "AI finds the weakest lines in your resume and rewrites them. Replace placeholders like [X]% with your real numbers, then update your resume."
          : "Upload your resume above to find and fix its weak lines automatically."}
      </p>
      <button className="primary" onClick={improve} disabled={!file || loading}>
        {loading ? "Finding weak lines…" : lines.length ? "Run again" : "Find & fix weak lines 🪄"}
      </button>

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
            <button type="button" className="ghost" onClick={download}>
              Download .txt
            </button>
          </div>
        </>
      )}
    </section>
  );
}
