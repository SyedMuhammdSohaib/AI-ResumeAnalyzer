import AutoImprove from "@/components/AutoImprove";
import ResumeInput from "@/components/ResumeInput";

export default function AutoImprovePage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Auto-Improve</span>
        <h1>Auto-improve your resume</h1>
        <p>
          AI finds the weakest lines in your resume, shows a before/after rewrite for each, and
          can build a complete improved CV as an editable Word file or a PDF.
        </p>
      </header>
      <ResumeInput jdHint="optional, tailors the rewrites to this job" />
      <AutoImprove />
    </main>
  );
}
