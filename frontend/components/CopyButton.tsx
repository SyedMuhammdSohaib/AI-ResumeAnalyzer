"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; user can still select the text */
    }
  }

  return (
    <button type="button" className="ghost" onClick={copy}>
      {copied ? "Copied ✓" : label}
    </button>
  );
}
