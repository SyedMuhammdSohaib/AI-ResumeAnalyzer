// Saved results, kept only in this browser (localStorage). Nothing is sent to a server.
import type { ResumeAnalysis, SkillRoadmap } from "./types";

const STORAGE_KEY = "resume-analyzer-history-v1";
const MAX_ENTRIES = 30;

type Base = { id: string; createdAt: string; fileName: string };

export type HistoryEntry =
  | (Base & { kind: "analysis"; result: ResumeAnalysis })
  | (Base & { kind: "roadmap"; result: SkillRoadmap });

export type NewHistoryEntry =
  | { kind: "analysis"; fileName: string; result: ResumeAnalysis }
  | { kind: "roadmap"; fileName: string; result: SkillRoadmap };

/** Newest first. Returns [] if storage is unavailable or the data is unreadable. */
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or blocked (e.g. private mode): history is a convenience only */
  }
}

export function addHistory(entry: NewHistoryEntry): void {
  const full = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  } as HistoryEntry;
  save([full, ...loadHistory()]);
}

export function removeHistory(id: string): HistoryEntry[] {
  const next = loadHistory().filter((entry) => entry.id !== id);
  save(next);
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
