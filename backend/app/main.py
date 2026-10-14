import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CORS_ORIGINS, MAX_FILE_SIZE
from .schemas import CoverLetter, Language, ResumeAnalysis, RewriteRequest, RewriteResult
from .services.analyzer import analyze_resume, rewrite_bullet, write_cover_letter
from .services.pdf import ResumeValidationError, extract_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume-analyzer")

app = FastAPI(title="AI Resume Analyzer API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _read_resume(file: UploadFile) -> str:
    if file.content_type and not file.content_type.startswith("application/pdf"):
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=415,
                detail="Invalid file type. Please upload a PDF resume.",
            )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 5 MB.")

    try:
        return extract_text(file.filename or "", content)
    except ResumeValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


def _ai_error(exc: RuntimeError) -> HTTPException:
    message = str(exc)
    if "GROQ_API_KEY" in message:
        return HTTPException(status_code=503, detail=message)
    logger.error("AI request failed: %s", message)
    return HTTPException(
        status_code=502,
        detail="The AI service could not complete the request. Please try again.",
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=ResumeAnalysis)
async def analyze(
    file: UploadFile = File(..., description="Resume PDF"),
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


@app.post("/cover-letter", response_model=CoverLetter)
async def cover_letter(
    file: UploadFile = File(..., description="Resume PDF"),
    job_description: str = Form(..., min_length=20, max_length=20000),
) -> CoverLetter:
    resume_text = await _read_resume(file)
    logger.info("Writing cover letter for: %s", file.filename)
    try:
        return await write_cover_letter(resume_text, job_description)
    except RuntimeError as exc:
        raise _ai_error(exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
