import asyncio
import re

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from ..config import GROQ_API_KEY, GROQ_MODEL
from ..schemas import CoverLetter, Language, ResumeAnalysis, RewriteResult

AI_TIMEOUT_SECONDS = 90

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

Be concise. Never invent employers or facts not present in the resume.

Output language: {language_rule}"""

USER_PROMPT = """Resume:
\"\"\"
{resume_text}
\"\"\"

{jd_section}Respond with the structured analysis."""

LANGUAGE_RULES: dict[str, str] = {
    "English": "Write all feedback in English.",
    "Roman Urdu": (
        "Write summary, ats_reason, strengths, weaknesses and suggestions in simple "
        "Roman Urdu (Urdu written with English letters, e.g. 'Aapka resume achha hai')."
    ),
    "Urdu": (
        "Write summary, ats_reason, strengths, weaknesses and suggestions in simple "
        "Urdu using Urdu script."
    ),
    "Hindi": (
        "Write summary, ats_reason, strengths, weaknesses and suggestions in simple "
        "Hindi using Devanagari script."
    ),
}
SKILLS_RULE = (
    " Keep skills and missing_keywords in English, and keep quoted resume phrases "
    "in their original wording."
)

REWRITE_SYSTEM_PROMPT = """You are an expert resume writer.
The user gives you one line or bullet point from their resume. Rewrite it into exactly
3 stronger alternatives for a resume, in English.

Rules:
- Start with a strong action verb (Led, Built, Designed, Improved, Reduced...).
- Be specific and concise: one line each, no more than 30 words.
- Show impact. If the original has no numbers, you may use a clear placeholder like
  "[X]%" or "[N] users" so the candidate can fill in their real figure. Never invent
  concrete numbers, employers, or technologies that are not in the original.
- If a job description is given, naturally use its relevant keywords where truthful.
- Output exactly 3 lines, one rewrite per line, and nothing else: no intro, no
  numbering, no bullet symbols, no explanations."""

REWRITE_USER_PROMPT = """Original line:
\"\"\"
{text}
\"\"\"

{jd_section}Rewrite it."""

COVER_LETTER_SYSTEM_PROMPT = """You are an expert career coach who writes cover letters.
Write a professional, warm cover letter in English for the candidate below, tailored to
the job description.

Rules:
- 250-350 words, 3-4 short paragraphs, plain text (no markdown).
- Start with "Dear Hiring Manager," unless the job description names a person.
- Connect 2-3 of the candidate's real achievements and skills to the job's needs.
- Use only facts from the resume. Never invent employers, degrees, numbers or skills.
- End with a polite call to action and sign off with the candidate's name from the resume
  (use "[Your Name]" if no name is found)."""

COVER_LETTER_USER_PROMPT = """Resume:
\"\"\"
{resume_text}
\"\"\"

Job Description:
\"\"\"
{job_description}
\"\"\"

Write the cover letter."""


def _llm(temperature: float = 0) -> ChatGroq:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env")
    if not GROQ_MODEL:
        raise RuntimeError("GROQ_MODEL is not set. Add it to backend/.env")
    return ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=temperature)


def _jd_section(job_description: str | None, heading: str) -> str:
    if job_description and job_description.strip():
        return f"{heading}:\n\"\"\"\n{job_description.strip()}\n\"\"\"\n\n"
    return "No job description provided.\n\n"


async def _run(chain, inputs: dict):
    try:
        return await asyncio.wait_for(chain.ainvoke(inputs), timeout=AI_TIMEOUT_SECONDS)
    except asyncio.TimeoutError as exc:
        raise RuntimeError("AI request timed out. Please try again.") from exc
    except Exception as exc:
        raise RuntimeError(f"AI request failed: {exc}") from exc


async def analyze_resume(
    resume_text: str, job_description: str | None, language: Language = "English"
) -> ResumeAnalysis:
    language_rule = LANGUAGE_RULES[language]
    if language != "English":
        language_rule += SKILLS_RULE

    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", USER_PROMPT)]
    )
    chain = prompt | _llm().with_structured_output(ResumeAnalysis)
    return await _run(
        chain,
        {
            "resume_text": resume_text,
            "jd_section": _jd_section(job_description, "Job Description (analyze fit against this)"),
            "language_rule": language_rule,
        },
    )


async def rewrite_bullet(text: str, job_description: str | None) -> RewriteResult:
    prompt = ChatPromptTemplate.from_messages(
        [("system", REWRITE_SYSTEM_PROMPT), ("human", REWRITE_USER_PROMPT)]
    )
    # Plain text output: more reliable than tool calling for such a small task.
    chain = prompt | _llm(temperature=0.4) | StrOutputParser()
    output: str = await _run(
        chain,
        {
            "text": text.strip(),
            "jd_section": _jd_section(job_description, "Target job description"),
        },
    )
    options = [_clean_line(line) for line in output.splitlines()]
    options = [line for line in options if line]
    if not options:
        raise RuntimeError("AI returned an empty rewrite.")
    return RewriteResult(options=options[:3])


def _clean_line(line: str) -> str:
    """Strip list markers, markdown bold and wrapping quotes the model may add."""
    line = re.sub(r"^\s*(?:[-•*]|\d+[.)])\s*", "", line).replace("**", "")
    return line.strip().strip('"').strip()


async def write_cover_letter(resume_text: str, job_description: str) -> CoverLetter:
    prompt = ChatPromptTemplate.from_messages(
        [("system", COVER_LETTER_SYSTEM_PROMPT), ("human", COVER_LETTER_USER_PROMPT)]
    )
    chain = prompt | _llm(temperature=0.5) | StrOutputParser()
    letter: str = await _run(
        chain,
        {"resume_text": resume_text, "job_description": job_description.strip()},
    )
    return CoverLetter(cover_letter=letter.strip())
