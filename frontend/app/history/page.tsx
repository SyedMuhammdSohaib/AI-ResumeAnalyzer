import History from "@/components/History";

export default function HistoryPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">History</span>
        <h1>Your history</h1>
        <p>
          Every analysis and roadmap you run is saved here, so you can see how your resume
          improves over time. It is stored only in this browser and never sent anywhere.
        </p>
      </header>
      <History />
    </main>
  );
}
