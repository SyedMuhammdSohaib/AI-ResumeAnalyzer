from pydantic import BaseModel, Field


class SectionScores(BaseModel):
    skills: int = Field(ge=0, le=100)
    experience: int = Field(ge=0, le=100)
    education: int = Field(ge=0, le=100)
    formatting: int = Field(ge=0, le=100)


class JobMatch(BaseModel):
    match_percentage: int = Field(ge=0, le=100)
    missing_keywords: list[str]


class ResumeAnalysis(BaseModel):
    summary: str
    skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    ats_score: int = Field(ge=0, le=100)
    ats_reason: str
    section_scores: SectionScores
    suggestions: list[str]
    job_match: JobMatch | None = None
