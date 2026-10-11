from io import BytesIO

from pypdf import PdfReader

from ..config import MAX_FILE_SIZE


class ResumeValidationError(Exception):
    """Raised when an uploaded file cannot be used as a resume."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def extract_text(filename: str, content: bytes) -> str:
    if not filename or not filename.lower().endswith(".pdf"):
        raise ResumeValidationError(
            "Invalid file type. Please upload a PDF resume.", status_code=415
        )

    if not content:
        raise ResumeValidationError(
            "The uploaded file is empty.", status_code=422
        )

    if len(content) > MAX_FILE_SIZE:
        raise ResumeValidationError(
            "File is too large. Maximum size is 5 MB.", status_code=413
        )

    if b"%PDF-" not in content[:1024]:
        raise ResumeValidationError(
            "File does not look like a valid PDF.", status_code=415
        )

    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ResumeValidationError(
                "PDF is encrypted/password-protected. Please upload an open PDF.",
                status_code=422,
            )
        pages = reader.pages
        text = "\n".join((page.extract_text() or "") for page in pages).strip()
    except ResumeValidationError:
        raise
    except Exception:
        raise ResumeValidationError(
            "Could not read the PDF. It may be corrupted.", status_code=422
        )

    if not text:
        raise ResumeValidationError(
            "No extractable text found in the PDF (it may be a scanned image).",
            status_code=422,
        )

    return text
