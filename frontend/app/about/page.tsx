import Link from "next/link";

const STACK = [
  { layer: "Frontend", tech: "Next.js, React, TypeScript" },
  { layer: "Backend", tech: "Python, FastAPI" },
  { layer: "AI", tech: "LangChain + Groq-hosted LLMs" },
  { layer: "Hosting", tech: "Vercel (frontend and backend)" },
];

const ROADMAP = [
  "Interview question generator",
  "Download the analysis as a PDF report",
  "User accounts, so history syncs across devices",
];

export default function AboutPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">About</span>
        <h1>About this project</h1>
        <p>
          AI Resume Analyzer helps job seekers see their resume the way recruiters and applicant
          tracking systems (ATS) do, and then fix it. It started as a beginner-friendly MVP to
          learn how to build a real AI product end to end.
        </p>
      </header>

      <section className="card">
        <h2>Why it exists</h2>
        <p className="muted about-text">
          Most resumes are filtered out by software before a person reads them. Generic advice
          like &ldquo;add more keywords&rdquo; is hard to act on. This app gives specific
          feedback on your own resume, shows exactly which lines are weak, rewrites them, and
          explains the feedback in English, Roman Urdu, Urdu or Hindi.
        </p>
      </section>

      <section className="card">
        <h2>How it is built</h2>
        <div className="bars">
          {STACK.map((row) => (
            <div className="stack-row" key={row.layer}>
              <span className="bar-label">{row.layer}</span>
              <span>{row.tech}</span>
            </div>
          ))}
        </div>
        <p className="muted about-text">
          The backend extracts text from your PDF or Word file and sends it to the LLM with a carefully
          written prompt. The app does not save your resume; it is only used to answer that
          request.
        </p>
      </section>

      <section className="card">
        <h2>What&rsquo;s next</h2>
        <ul>
          {ROADMAP.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Author</h2>
        <p className="about-text">
          Built by <strong>Syed Muhammad Sohaib</strong>.{" "}
          <Link href="/contact" className="text-link">
            Get in touch →
          </Link>
        </p>
      </section>
    </main>
  );
}
