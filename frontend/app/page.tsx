import ResumeAnalyzer from "@/components/ResumeAnalyzer";

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">AI-powered</span>
        <h1>Resume Analyzer</h1>
        <p>
          Upload your resume PDF and get an ATS score, section-wise ratings,
          strengths, weaknesses and actionable suggestions. Add a job description
          to see how well you match.
        </p>
      </header>
      <ResumeAnalyzer />
      <footer className="footer">FastAPI + Groq backend on port 8000</footer>
    </main>
  );
}
