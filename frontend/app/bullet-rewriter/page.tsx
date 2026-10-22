import BulletRewriter from "@/components/BulletRewriter";
import ResumeInput from "@/components/ResumeInput";

export default function BulletRewriterPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Bullet Rewriter</span>
        <h1>Rewrite a resume line</h1>
        <p>
          Paste one weak line from your resume and get 3 stronger, results-focused versions. No
          upload needed.
        </p>
      </header>
      <BulletRewriter />
      <ResumeInput showUpload={false} jdHint="optional, tailors the rewrites to this job" />
    </main>
  );
}
