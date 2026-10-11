import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, MAX_FILE_SIZE
from .schemas import ResumeAnalysis
from .services.analyzer import analyze_resume
from .services.pdf import ResumeValidationError, extract_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume-analyzer")

app = FastAPI(title="AI Resume Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=ResumeAnalysis)
async def analyze(
    file: UploadFile = File(..., description="Resume PDF"),
    job_description: str | None = Form(default=None, max_length=20000),
) -> ResumeAnalysis:
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
        resume_text = extract_text(file.filename or "", content)
    except ResumeValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    logger.info("Analyzing resume: %s (%d chars of text)", file.filename, len(resume_text))

    try:
        return await analyze_resume(resume_text, job_description)
    except RuntimeError as exc:
        message = str(exc)
        if "GROQ_API_KEY" in message:
            raise HTTPException(status_code=503, detail=message)
        logger.error("Analysis failed: %s", message)
        raise HTTPException(
            status_code=502,
            detail="The AI service could not complete the analysis. Please try again.",
        )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error: %s", exc)
    return HTTPException(status_code=500, detail="Internal server error.")
