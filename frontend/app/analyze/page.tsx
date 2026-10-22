import ResumeAnalyzer from "@/components/ResumeAnalyzer";

export default function AnalyzePage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Analyzer</span>
        <h1>Resume Analyzer</h1>
        <p>
          Upload your resume PDF and get an ATS score, section-wise ratings, strengths,
          weaknesses and actionable suggestions. Add a job description to see how well you match.
        </p>
      </header>
      <ResumeAnalyzer />
    </main>
  );
}
