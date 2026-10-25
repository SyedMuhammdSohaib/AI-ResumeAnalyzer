"use client";

import { useRef, useState } from "react";

import { fileSizeError } from "@/lib/api";
import { useResume } from "./ResumeContext";

export default function ResumeInput({
  showUpload = true,
  jdHint = "optional, improves job-match scoring",
  children,
}: {
  showUpload?: boolean;
  jdHint?: string;
  children?: React.ReactNode;
}) {
  const { file, setFile, jobDescription, setJobDescription } = useResume();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(next: File | null) {
    if (!next) return;
    const problem = fileSizeError(next);
    setError(problem);
    setFile(problem ? null : next);
  }

  return (
    <section className="card">
      {showUpload && (
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
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <span className="dropzone-icon">PDF / DOCX</span>
          {file ? (
            <p className="file-name">
              {file.name} <span className="muted">({(file.size / 1024).toFixed(0)} KB)</span>
            </p>
          ) : (
            <p className="muted">Drop your resume here, or click to browse (max 5 MB)</p>
          )}
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <label className="field-label" htmlFor="jd">
        Job description <span className="muted">({jdHint})</span>
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
      {children}
    </section>
  );
}
