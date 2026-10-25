import SkillRoadmap from "@/components/SkillRoadmap";

export default function SkillRoadmapPage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="badge">Skill Roadmap</span>
        <h1>Skill gap roadmap</h1>
        <p>
          Find the skills you are missing for your target role and get a step-by-step learning
          plan with time estimates and free resources.
        </p>
      </header>
      <SkillRoadmap />
    </main>
  );
}
