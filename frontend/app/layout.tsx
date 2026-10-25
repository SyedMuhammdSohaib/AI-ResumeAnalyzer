import type { Metadata } from "next";

import NavBar from "@/components/NavBar";
import { ResumeProvider } from "@/components/ResumeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description: "Upload a resume (PDF or DOCX) and get an instant ATS score, feedback and job-match analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ResumeProvider>
          <NavBar />
          <div className="main-area">
            {children}
            <footer className="footer">Powered by a FastAPI + Groq backend</footer>
          </div>
        </ResumeProvider>
      </body>
    </html>
  );
}
