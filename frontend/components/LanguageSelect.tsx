"use client";

import type { Language } from "@/lib/types";
import { useResume } from "./ResumeContext";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "English", label: "English" },
  { value: "Roman Urdu", label: "Roman Urdu" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Hindi", label: "हिंदी (Hindi)" },
];

export default function LanguageSelect() {
  const { language, setLanguage } = useResume();

  return (
    <>
      <label className="field-label" htmlFor="language">
        Feedback language
      </label>
      <select
        id="language"
        className="select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </>
  );
}
