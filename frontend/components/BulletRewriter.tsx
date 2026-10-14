"use client";

import { useState } from "react";

import { postApi } from "@/lib/api";
import type { RewriteResult } from "@/lib/types";
import CopyButton from "./CopyButton";

export default function BulletRewriter({ jobDescription }: { jobDescription: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  const ready = text.trim().length >= 3;

  async function rewrite() {
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    setOptions([]);
    try {
      const result = await postApi<RewriteResult>("/rewrite", {
        text: text.trim(),
        job_description: jobDescription.trim() || null,
      });
      setOptions(result.options);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Bullet rewriter</h2>
      <p className="muted tool-hint">
        Paste a weak line from your resume and get 3 stronger versions. Replace placeholders
        like [X]% with your real numbers.
      </p>
      <textarea
        className="jd"
        rows={2}
        maxLength={1000}
        placeholder="e.g. I was responsible for managing the company website"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="primary" onClick={rewrite} disabled={!ready || loading}>
        {loading ? "Rewriting…" : "Rewrite ✨"}
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {options.length > 0 && (
        <ul className="options">
          {options.map((option) => (
            <li key={option}>
              <span>{option}</span>
              <CopyButton text={option} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
