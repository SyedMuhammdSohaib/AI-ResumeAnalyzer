import CoverLetter from "@/components/CoverLetter";
import ResumeInput from "@/components/ResumeInput";

export default function CoverLetterPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Cover Letter</span>
        <h1>Cover letter generator</h1>
        <p>
          Writes a cover letter tailored to the job, using only facts from your resume. You can
          edit it, copy it or download it.
        </p>
      </header>
      <ResumeInput jdHint="required for the cover letter" />
      <CoverLetter />
    </main>
  );
}
