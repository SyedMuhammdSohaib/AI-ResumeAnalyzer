import asyncio
import re

import groq

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from ..config import GROQ_API_KEY, GROQ_MODEL
from ..schemas import (
    CoverLetter,
    ImprovedLine,
    ImproveResult,
    Language,
    ResumeAnalysis,
    RewriteResult,
)

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

IMPROVE_SYSTEM_PROMPT = """You are an expert resume writer.
Read the resume and find its 4-8 weakest lines: vague bullet points, lines without a strong
action verb, lines that list duties instead of results, or lines with no measurable impact.
For each one, write a stronger version for the resume, in English.

Rules for the improved line:
- Start with a strong action verb (Led, Built, Designed, Improved, Reduced...).
- One line, no more than 30 words, focused on impact.
- If there is no number, you may use a placeholder like "[X]%" or "[N] users" for the
  candidate to fill in. Never invent concrete numbers, employers, or technologies.
- If a job description is given, use its relevant keywords where truthful.

Output format, repeated for every weak line, and nothing else:
ORIGINAL: <the weak line copied exactly as written in the resume>
IMPROVED: <the stronger version>
WHY: <one short sentence on what was weak>
"""

IMPROVE_USER_PROMPT = """Resume:
\"\"\"
{resume_text}
\"\"\"

{jd_section}Find and improve the weakest lines."""

IMPROVED_CV_SYSTEM_PROMPT = """You are an expert resume writer.
Rewrite the candidate's whole resume into a stronger, ATS-friendly version in English.

Content rules:
- Keep every real fact: name, contact details, employers, job titles, dates, degrees,
  schools, projects, certifications and skills. Never invent any of them.
- Rewrite weak bullet points with strong action verbs and a focus on impact. Where a
  number would help but none is given, use a placeholder like "[X]%" or "[N] users".
- Add a 2-3 line professional summary at the top if there is none (facts only).
- If a job description is given, use its relevant keywords where truthful.
- If approved rewrites are given, use them for those lines.

Output format: plain markdown using ONLY these elements, with no code fences and no
commentary before or after:
# Full Name
contact line (email | phone | city | links)
## SECTION NAME
### Job Title | Company | Dates
- bullet point
plain text line (for the summary or skills)
"""

IMPROVED_CV_USER_PROMPT = """Resume:
\"\"\"
{resume_text}
\"\"\"

{jd_section}{rewrites_section}Write the improved resume."""

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


class AIServiceError(RuntimeError):
    """An AI failure with a message that is safe and useful to show to the user."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _groq_error_message(exc: Exception) -> AIServiceError | None:
    if isinstance(exc, groq.AuthenticationError):
        return AIServiceError(
            "Groq rejected the API key. Check GROQ_API_KEY (no spaces or quotes).", 503
        )
    if isinstance(exc, groq.NotFoundError):
        return AIServiceError(
            f"Groq model '{GROQ_MODEL}' was not found. Check GROQ_MODEL.", 503
        )
    if isinstance(exc, groq.PermissionDeniedError):
        return AIServiceError(
            f"Your Groq account cannot use model '{GROQ_MODEL}'. Try another GROQ_MODEL.", 503
        )
    if isinstance(exc, groq.RateLimitError):
        return AIServiceError("Groq rate limit reached. Wait a minute and try again.", 429)
    if isinstance(exc, (groq.APIConnectionError, groq.APITimeoutError)):
        return AIServiceError("Could not connect to Groq. Please try again.", 502)
    if isinstance(exc, groq.BadRequestError):
        return AIServiceError(f"Groq rejected the request: {str(exc)[:300]}", 502)
    return None


async def _run(chain, inputs: dict):
    try:
        return await asyncio.wait_for(chain.ainvoke(inputs), timeout=AI_TIMEOUT_SECONDS)
    except asyncio.TimeoutError as exc:
        raise AIServiceError("AI request timed out. Please try again.", 504) from exc
    except Exception as exc:
        friendly = _groq_error_message(exc)
        if friendly:
            raise friendly from exc
        raise RuntimeError(f"AI request failed: {type(exc).__name__}: {exc}") from exc


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


_IMPROVE_FIELD = re.compile(r"^\s*\**\s*(ORIGINAL|IMPROVED|WHY)\s*\**\s*:\s*\**\s*(.*)$", re.I)


def _parse_improvements(output: str) -> list[ImprovedLine]:
    """Parse ORIGINAL/IMPROVED/WHY blocks from the model's plain text output."""
    lines: list[ImprovedLine] = []
    current: dict[str, str] = {}

    def flush() -> None:
        if current.get("original") and current.get("improved"):
            lines.append(
                ImprovedLine(
                    original=_clean_line(current["original"]),
                    improved=_clean_line(current["improved"]),
                    reason=_clean_line(current.get("why", "")),
                )
            )
        current.clear()

    for raw in output.splitlines():
        match = _IMPROVE_FIELD.match(raw)
        if not match:
            continue
        key, value = match.group(1).lower(), match.group(2)
        if key == "original" and current:
            flush()
        current[key] = value
    flush()
    return lines


async def improve_resume(resume_text: str, job_description: str | None) -> ImproveResult:
    prompt = ChatPromptTemplate.from_messages(
        [("system", IMPROVE_SYSTEM_PROMPT), ("human", IMPROVE_USER_PROMPT)]
    )
    # Plain text output, like the rewriter: more reliable than tool calling.
    chain = prompt | _llm(temperature=0.3) | StrOutputParser()
    output: str = await _run(
        chain,
        {
            "resume_text": resume_text,
            "jd_section": _jd_section(job_description, "Target job description"),
        },
    )
    lines = _parse_improvements(output)
    if not lines:
        raise RuntimeError("AI returned no improvements.")
    return ImproveResult(lines=lines)


async def write_improved_resume(
    resume_text: str, job_description: str | None, rewrites: list[ImprovedLine]
) -> str:
    """Return the improved resume as simple markdown (see IMPROVED_CV_SYSTEM_PROMPT)."""
    rewrites_section = ""
    if rewrites:
        pairs = "\n".join(f"- {r.original} => {r.improved}" for r in rewrites)
        rewrites_section = f"Approved rewrites (original => improved):\n{pairs}\n\n"

    prompt = ChatPromptTemplate.from_messages(
        [("system", IMPROVED_CV_SYSTEM_PROMPT), ("human", IMPROVED_CV_USER_PROMPT)]
    )
    chain = prompt | _llm(temperature=0.3) | StrOutputParser()
    markdown: str = await _run(
        chain,
        {
            "resume_text": resume_text,
            "jd_section": _jd_section(job_description, "Target job description"),
            "rewrites_section": rewrites_section,
        },
    )
    if "## " not in markdown:
        raise RuntimeError("AI returned a resume without sections.")
    return markdown.strip()


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
