import json
import logging
import os
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import TypeAdapter, ValidationError

from .config import ALLOWED_ORIGINS, MAX_FILE_SIZE
from .schemas import (
    CoverLetter,
    ImprovedLine,
    ImproveResult,
    Language,
    ResumeAnalysis,
    RewriteRequest,
    RewriteResult,
    SkillRoadmap,
)
from .services.analyzer import (
    AIServiceError,
    analyze_resume,
    build_skill_roadmap,
    improve_resume,
    write_improved_resume,
    rewrite_bullet,
    write_cover_letter,
)
from .services.docx_builder import build_docx
from .services.pdf_builder import build_pdf
from .services.pdf import ResumeValidationError, extract_text
from .vercel import VercelPathMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume-analyzer")

app = FastAPI(title="AI Resume Analyzer API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel sets VERCEL=1; there, requests can arrive rewritten to the function path.
if os.getenv("VERCEL"):
    app.add_middleware(VercelPathMiddleware)


async def _read_resume(file: UploadFile) -> str:
    # File type is checked by extension and content in extract_text.
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 5 MB.")

    try:
        return extract_text(file.filename or "", content)
    except ResumeValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


def _ai_error(exc: RuntimeError) -> HTTPException:
    message = str(exc)
    if "is not set" in message:
        return HTTPException(status_code=503, detail=message)
    logger.error("AI request failed: %s", message)
    if isinstance(exc, AIServiceError):
        return HTTPException(status_code=exc.status_code, detail=exc.message)
    return HTTPException(
        status_code=502,
        detail=f"The AI service could not complete the request ({message[:200]}). Please try again.",
    )


@app.get("/")
async def root() -> dict:
    return {"message": "AI Resume Analyzer API is running.", "docs": "/docs"}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=ResumeAnalysis)
async def analyze(
    file: UploadFile = File(..., description="Resume (PDF or DOCX)"),
    job_description: str | None = Form(default=None, max_length=20000),
    language: Language = Form(default="English"),
) -> ResumeAnalysis:
    resume_text = await _read_resume(file)
    logger.info(
        "Analyzing resume: %s (%d chars of text, %s)", file.filename, len(resume_text), language
    )
    try:
        return await analyze_resume(resume_text, job_description, language)
    except RuntimeError as exc:
        raise _ai_error(exc)


@app.post("/rewrite", response_model=RewriteResult)
async def rewrite(request: RewriteRequest) -> RewriteResult:
    try:
        return await rewrite_bullet(request.text, request.job_description)
    except RuntimeError as exc:
        raise _ai_error(exc)


@app.post("/improve", response_model=ImproveResult)
async def improve(
    file: UploadFile = File(..., description="Resume (PDF or DOCX)"),
    job_description: str | None = Form(default=None, max_length=20000),
) -> ImproveResult:
    resume_text = await _read_resume(file)
    logger.info("Improving weak lines for: %s", file.filename)
    try:
        return await improve_resume(resume_text, job_description)
    except RuntimeError as exc:
        raise _ai_error(exc)


DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
CV_FORMATS = {
    "docx": (build_docx, DOCX_MEDIA_TYPE),
    "pdf": (build_pdf, "application/pdf"),
}
_rewrites_adapter = TypeAdapter(list[ImprovedLine])


@app.post("/improved-cv")
async def improved_cv(
    file: UploadFile = File(..., description="Resume (PDF or DOCX)"),
    job_description: str | None = Form(default=None, max_length=20000),
    rewrites: str | None = Form(default=None, max_length=50000),
    format: Literal["docx", "pdf"] = Form(default="docx"),
) -> Response:
    """Rewrite the whole resume with AI and return it as a Word (.docx) or PDF file."""
    approved: list[ImprovedLine] = []
    if rewrites:
        try:
            approved = _rewrites_adapter.validate_python(json.loads(rewrites))
        except (ValueError, ValidationError):
            raise HTTPException(status_code=422, detail="Invalid rewrites data.")

    resume_text = await _read_resume(file)
    logger.info("Building improved CV (%s) for: %s", format, file.filename)
    try:
        markdown = await write_improved_resume(resume_text, job_description, approved)
    except RuntimeError as exc:
        raise _ai_error(exc)

    build, media_type = CV_FORMATS[format]
    return Response(
        content=build(markdown),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="improved-resume.{format}"'},
    )


@app.post("/cover-letter", response_model=CoverLetter)
async def cover_letter(
    file: UploadFile = File(..., description="Resume (PDF or DOCX)"),
    job_description: str = Form(..., min_length=20, max_length=20000),
) -> CoverLetter:
    resume_text = await _read_resume(file)
    logger.info("Writing cover letter for: %s", file.filename)
    try:
        return await write_cover_letter(resume_text, job_description)
    except RuntimeError as exc:
        raise _ai_error(exc)


@app.post("/skill-roadmap", response_model=SkillRoadmap)
async def skill_roadmap(
    file: UploadFile = File(..., description="Resume (PDF or DOCX)"),
    job_description: str | None = Form(default=None, max_length=20000),
    target_role: str | None = Form(default=None, max_length=200),
    language: Language = Form(default="English"),
) -> SkillRoadmap:
    resume_text = await _read_resume(file)
    logger.info("Building skill roadmap for: %s (%s)", file.filename, language)
    try:
        return await build_skill_roadmap(resume_text, job_description, target_role, language)
    except RuntimeError as exc:
        raise _ai_error(exc)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    content: dict = {"detail": exc.detail}
    if exc.status_code == 404:
        # Helps debug hosting/routing problems: shows the path the app actually saw.
        content["path"] = request.url.path
        content["query"] = request.url.query
    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
