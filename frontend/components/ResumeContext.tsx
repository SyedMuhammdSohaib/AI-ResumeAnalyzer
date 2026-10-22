"use client";

import { createContext, useContext, useState } from "react";

import type { Language } from "@/lib/types";

// Shared across pages so the resume is uploaded once and reused by every tool.
type ResumeState = {
  file: File | null;
  setFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (text: string) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const ResumeContext = createContext<ResumeState | null>(null);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [language, setLanguage] = useState<Language>("English");

  return (
    <ResumeContext.Provider
      value={{ file, setFile, jobDescription, setJobDescription, language, setLanguage }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume(): ResumeState {
  const state = useContext(ResumeContext);
  if (!state) throw new Error("useResume must be used inside <ResumeProvider>");
  return state;
}
