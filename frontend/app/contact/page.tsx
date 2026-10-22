const REPO_URL = "https://github.com/SyedMuhammdSohaib/AI-ResumeAnalyzer";

const CHANNELS = [
  {
    title: "GitHub",
    text: "See my other projects and follow my work.",
    href: "https://github.com/SyedMuhammdSohaib",
    action: "@SyedMuhammdSohaib",
  },
  {
    title: "Report a bug",
    text: "Something broken or a wrong result? Open an issue with the details.",
    href: `${REPO_URL}/issues/new`,
    action: "Open an issue",
  },
  {
    title: "Source code",
    text: "The full project is open source. Stars and contributions are welcome.",
    href: REPO_URL,
    action: "View repository",
  },
];

export default function ContactPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Contact</span>
        <h1>Get in touch</h1>
        <p>
          Have feedback, found a bug, or want to collaborate? Reach out through any of the
          channels below.
        </p>
      </header>

      <div className="feature-grid contact-grid">
        {CHANNELS.map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card feature-card"
          >
            <h2>{channel.title}</h2>
            <p className="muted">{channel.text}</p>
            <span className="feature-link">{channel.action} →</span>
          </a>
        ))}
      </div>
    </main>
  );
}
