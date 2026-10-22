import Link from "next/link";

import { TOOLS } from "@/lib/tools";

const STEPS = [
  { title: "Upload", text: "Drop your resume PDF. Optionally paste the job you are applying for." },
  { title: "Analyze", text: "The backend reads your resume and a Groq-hosted LLM reviews it." },
  { title: "Improve", text: "Get scores, fixes, rewritten lines, a new CV and a cover letter." },
];

const STACK = ["Next.js", "React", "FastAPI", "LangChain", "Groq"];

export default function Home() {
  return (
    <main className="page">
      <header className="hero home-hero">
        <span className="badge">AI-powered</span>
        <h1>Make your resume stand out</h1>
        <p>
          AI Resume Analyzer reviews your resume like a recruiter and an ATS would. Get a score,
          clear feedback and AI tools that rewrite weak lines, build an improved CV and write
          your cover letter. Feedback is available in English, Roman Urdu, Urdu and Hindi.
        </p>
        <div className="actions">
          <Link href="/analyze" className="primary">
            Analyze my resume
          </Link>
          <Link href="/auto-improve" className="secondary">
            Auto-improve it
          </Link>
        </div>
      </header>

      <h2 className="tools-title">What you can do</h2>
      <div className="feature-grid">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card feature-card">
            <h2>{tool.title}</h2>
            <p className="muted">{tool.description}</p>
            <span className="feature-link">Open →</span>
          </Link>
        ))}
      </div>

      <h2 className="tools-title">How it works</h2>
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="card">
            <span className="step-number">{i + 1}</span>
            <h2>{step.title}</h2>
            <p className="muted">{step.text}</p>
          </li>
        ))}
      </ol>

      <section className="card">
        <h2>Built with</h2>
        <div className="chips">
          {STACK.map((name) => (
            <span className="chip" key={name}>
              {name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
