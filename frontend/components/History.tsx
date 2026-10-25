"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clearHistory, loadHistory, removeHistory, type HistoryEntry } from "@/lib/history";
import { Results } from "./ResumeAnalyzer";
import { RoadmapResult } from "./SkillRoadmap";

type Filter = "all" | HistoryEntry["kind"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "analysis", label: "Analyses" },
  { value: "roadmap", label: "Roadmaps" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // localStorage only exists in the browser, so read it after mounting.
  useEffect(() => setEntries(loadHistory()), []);

  if (entries === null) return null;

  if (entries.length === 0) {
    return (
      <section className="card empty-state">
        <h2>No history yet</h2>
        <p className="muted">
          Results from the <Link href="/analyze" className="text-link">Analyzer</Link> and the{" "}
          <Link href="/skill-roadmap" className="text-link">Skill Roadmap</Link> are saved here
          automatically, so you can see how your resume improves over time.
        </p>
      </section>
    );
  }

  // Oldest first, so each score can be compared with the one before it.
  const analyses = entries
    .filter((e): e is Extract<HistoryEntry, { kind: "analysis" }> => e.kind === "analysis")
    .reverse();
  const previousScore = new Map<string, number>();
  analyses.forEach((entry, i) => {
    if (i > 0) previousScore.set(entry.id, analyses[i - 1].result.ats_score);
  });

  const visible = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  function remove(id: string) {
    setEntries(removeHistory(id));
  }

  function clearAll() {
    if (!window.confirm("Delete all saved results from this browser?")) return;
    clearHistory();
    setEntries([]);
  }

  return (
    <div className="history">
      {analyses.length > 1 && <ScoreTrend analyses={analyses.slice(-10)} />}

      <div className="history-toolbar">
        <div className="filters" role="group" aria-label="Filter history">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter${filter === f.value ? " active" : ""}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="ghost" onClick={clearAll}>
          Clear all
        </button>
      </div>

      {visible.length === 0 && <p className="muted">Nothing saved in this category yet.</p>}

      <ul className="history-list">
        {visible.map((entry) => {
          const isOpen = openId === entry.id;
          const prev = previousScore.get(entry.id);
          return (
            <li key={entry.id} className="card history-item">
              <div className="history-row">
                <span className={`kind ${entry.kind}`}>
                  {entry.kind === "analysis" ? "Analysis" : "Roadmap"}
                </span>
                <div className="history-info">
                  <strong className="file-name">{entry.fileName}</strong>
                  <span className="muted">{formatDate(entry.createdAt)}</span>
                </div>
                {entry.kind === "analysis" ? (
                  <div className="history-metric">
                    <strong>{entry.result.ats_score}</strong>
                    <span className="muted"> ATS</span>
                    {prev !== undefined && <Delta value={entry.result.ats_score - prev} />}
                  </div>
                ) : (
                  <div className="history-metric">
                    <span>{entry.result.target_role}</span>
                    <span className="muted"> · {entry.result.gaps.length} skills</span>
                  </div>
                )}
                <div className="actions">
                  <button
                    type="button"
                    className="ghost"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : entry.id)}
                  >
                    {isOpen ? "Hide" : "View"}
                  </button>
                  <button type="button" className="ghost" onClick={() => remove(entry.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {isOpen &&
                (entry.kind === "analysis" ? (
                  <Results data={entry.result} />
                ) : (
                  <RoadmapResult data={entry.result} />
                ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="delta same">±0</span>;
  return (
    <span className={`delta ${value > 0 ? "up" : "down"}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

function ScoreTrend({ analyses }: { analyses: Extract<HistoryEntry, { kind: "analysis" }>[] }) {
  const first = analyses[0].result.ats_score;
  const last = analyses[analyses.length - 1].result.ats_score;
  return (
    <section className="card">
      <h2>ATS score progress</h2>
      <p className="muted trend-caption">
        From <strong>{first}</strong> to <strong>{last}</strong> over your last {analyses.length}{" "}
        analyses <Delta value={last - first} />
      </p>
      <div className="trend" role="img" aria-label={`ATS scores: ${analyses.map((a) => a.result.ats_score).join(", ")}`}>
        {analyses.map((entry) => {
          const score = entry.result.ats_score;
          return (
            <div className="trend-col" key={entry.id} title={formatDate(entry.createdAt)}>
              <span className="trend-value">{score}</span>
              <div className="trend-track">
                <div
                  className={`trend-bar${score >= 75 ? " good" : score >= 50 ? " mid" : " low"}`}
                  style={{ height: `${Math.max(score, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
