"""Smoke test: POST sample_resume.pdf to /analyze and print the result."""
import json
import sys

import httpx

BASE_URL = "http://127.0.0.1:8000"
PDF_PATH = "E:/resume-analyzer/backend/sample/sample_resume.pdf"
JOB_DESCRIPTION = "Python backend developer with FastAPI and Docker experience."


def main() -> int:
    with httpx.Client(base_url=BASE_URL, timeout=60.0) as client:
        health = client.get("/health")
        print(f"GET /health -> {health.status_code} {health.text}")

        with open(PDF_PATH, "rb") as fh:
            response = client.post(
                "/analyze",
                files={"file": ("sample_resume.pdf", fh, "application/pdf")},
                data={"job_description": JOB_DESCRIPTION},
            )

    print(f"POST /analyze -> {response.status_code}")
    try:
        payload = response.json()
    except ValueError:
        print(response.text)
        return 1

    if response.status_code != 200:
        print(json.dumps(payload, indent=2))
        return 1

    print(f"ats_score: {payload['ats_score']} ({payload['ats_reason']})")
    print(f"section_scores: {payload['section_scores']}")
    print(f"skills: {payload['skills']}")
    print(f"job_match: {payload.get('job_match')}")
    print(f"strengths: {len(payload['strengths'])}, "
          f"weaknesses: {len(payload['weaknesses'])}, "
          f"suggestions: {len(payload['suggestions'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
