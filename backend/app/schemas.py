from typing import Literal

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


Language = Literal["English", "Roman Urdu", "Urdu", "Hindi"]


class RewriteRequest(BaseModel):
    text: str = Field(min_length=3, max_length=1000)
    job_description: str | None = Field(default=None, max_length=20000)


class RewriteResult(BaseModel):
    options: list[str]


class CoverLetter(BaseModel):
    cover_letter: str


class ImprovedLine(BaseModel):
    original: str
    improved: str
    reason: str


class ImproveResult(BaseModel):
    lines: list[ImprovedLine]


class SkillGap(BaseModel):
    skill: str
    priority: Literal["High", "Medium", "Low"]
    time_estimate: str
    why: str
    steps: list[str]
    resources: list[str]


class SkillRoadmap(BaseModel):
    target_role: str
    summary: str
    current_skills: list[str]
    gaps: list[SkillGap]
    total_time: str
