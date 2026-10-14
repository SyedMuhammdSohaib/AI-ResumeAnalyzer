"use client";

import { useState } from "react";

import { postApi } from "@/lib/api";
import type { CoverLetterResult } from "@/lib/types";
import CopyButton from "./CopyButton";

const MIN_JD_LENGTH = 20;

export default function CoverLetter({
  file,
  jobDescription,
}: {
  file: File | null;
  jobDescription: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState("");

  const jd = jobDescription.trim();
  const ready = file !== null && jd.length >= MIN_JD_LENGTH;

  async function generate() {
    if (!file || !ready || loading) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("job_description", jd);
      const result = await postApi<CoverLetterResult>("/cover-letter", form);
      setLetter(result.cover_letter);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cover-letter.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <h2>Cover letter</h2>
      <p className="muted tool-hint">
        {ready
          ? "Writes a cover letter for this job using only facts from your resume."
          : "Upload your resume and paste a job description above to generate a cover letter."}
      </p>
      <button className="primary" onClick={generate} disabled={!ready || loading}>
        {loading ? "Writing…" : letter ? "Write again" : "Write cover letter ✉️"}
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {letter && (
        <>
          <textarea
            className="jd letter"
            rows={16}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            aria-label="Generated cover letter"
          />
          <div className="actions">
            <CopyButton text={letter} />
            <button type="button" className="ghost" onClick={download}>
              Download .txt
            </button>
          </div>
        </>
      )}
    </section>
  );
}
