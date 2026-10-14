import asyncio

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from ..config import GROQ_API_KEY, GROQ_MODEL
from ..schemas import ResumeAnalysis

SYSTEM_PROMPT = """You are an expert resume reviewer and ATS (Applicant Tracking System) specialist.
Analyze the resume provided by the user with strict, honest, actionable feedback.

Scoring rules:
- ats_score: overall ATS-friendliness, 0-100. Penalize vague wording, missing keywords,
  poor structure, and lack of quantified achievements. Reward clear sections, strong action
  verbs, metrics, and relevant keywords.
- section_scores: independent 0-100 scores for skills, experience, education, formatting.
- strengths: 3-6 concrete things the resume does well.
- weaknesses: 2-5 concrete problems (be specific and honest).
- suggestions: 4-8 actionable bullets the candidate can apply directly, e.g.
  "Replace 'Responsible for X' with 'Led X, achieving Y%'".
- skills: extract the hard/technical skills mentioned (8-15 items, short names).
- summary: 2-3 sentence honest overall assessment.
- If a job description is given: job_match.match_percentage = how well this resume fits
  the JD (0-100) and job_match.missing_keywords = important JD keywords absent from the
  resume. If no job description is given, set job_match to null.

Be concise. Never invent employers or facts not present in the resume."""

USER_PROMPT = """Resume:
\"\"\"
{resume_text}
\"\"\"

{jd_section}Respond with the structured analysis."""


def _build_chain():
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env")
    if not GROQ_MODEL:
        raise RuntimeError("GROQ_MODEL is not set. Add it to backend/.env")

    llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=0)
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", USER_PROMPT)]
    )
    return prompt | llm.with_structured_output(ResumeAnalysis)


async def analyze_resume(resume_text: str, job_description: str | None) -> ResumeAnalysis:
    jd_section = (
        f"Job Description (analyze fit against this):\n\"\"\"\n{job_description.strip()}\n\"\"\"\n\n"
        if job_description and job_description.strip()
        else "No job description provided.\n\n"
    )
    chain = _build_chain()
    try:
        result = await asyncio.wait_for(
            chain.ainvoke(
                {"resume_text": resume_text, "jd_section": jd_section}
            ),
            timeout=90,
        )
    except asyncio.TimeoutError as exc:
        raise RuntimeError("AI analysis timed out. Please try again.") from exc
    except Exception as exc:
        raise RuntimeError(f"AI analysis failed: {exc}") from exc
    return result
