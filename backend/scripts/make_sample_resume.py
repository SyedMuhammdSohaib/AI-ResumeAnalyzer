"""Generate a small, realistic sample resume PDF without any extra dependencies."""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "sample" / "sample_resume.pdf"

LINES: list[tuple[str, str, int]] = [
    # (font, text, size)
    ("F2", "ALEX MORGAN", 20),
    ("F1", "Senior Software Engineer  |  alex.morgan@email.com  |  +1 555 123 4567  |  San Francisco, CA", 10),
    ("F1", "linkedin.com/in/alexmorgan  |  github.com/alexmorgan", 10),
    ("F3", "", 10),
    ("F2", "SUMMARY", 13),
    ("F1", "Results-driven software engineer with 6+ years building scalable web applications", 11),
    ("F1", "in Python, TypeScript, and React. Led teams of up to 5 engineers, cut API latency", 11),
    ("F1", "by 40%, and shipped products used by 500k+ monthly users.", 11),
    ("F3", "", 10),
    ("F2", "SKILLS", 13),
    ("F1", "Languages: Python, TypeScript, JavaScript, SQL, Go", 11),
    ("F1", "Frameworks: React, Next.js, FastAPI, Django, Node.js, Tailwind CSS", 11),
    ("F1", "Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis, Git, CI/CD, Grafana", 11),
    ("F1", "Practices: REST API design, TDD, Agile/Scrum, system design, code review", 11),
    ("F3", "", 10),
    ("F2", "EXPERIENCE", 13),
    ("F2", "Senior Software Engineer - Acme Corp  |  2021 - Present", 11),
    ("F1", "- Led redesign of the payments API serving 2M requests/day, reducing p95 latency", 11),
    ("F1", "  from 800ms to 480ms (-40%) through query optimization and Redis caching.", 11),
    ("F1", "- Mentored 4 junior engineers; introduced code-review checklist that cut bugs", 11),
    ("F1", "  reported in production by 30% over two quarters.", 11),
    ("F1", "- Built a Next.js analytics dashboard adopted by 12 internal teams.", 11),
    ("F3", "", 6),
    ("F2", "Software Engineer - Beta Startup  |  2018 - 2021", 11),
    ("F1", "- Developed FastAPI microservices with PostgreSQL and Docker, deployed on AWS ECS.", 11),
    ("F1", "- Implemented CI/CD pipelines (GitHub Actions) that shortened release cycles", 11),
    ("F1", "  from weekly to daily deploys.", 11),
    ("F1", "- Collaborated with product and design to ship 3 customer-facing features", 11),
    ("F1", "  that increased activation by 18%.", 11),
    ("F3", "", 6),
    ("F2", "Software Intern - Gamma Inc.  |  2017", 11),
    ("F1", "- Automated a manual reporting workflow with Python, saving ~10 hours/week.", 11),
    ("F3", "", 10),
    ("F2", "EDUCATION", 13),
    ("F1", "B.S. Computer Science - State University  |  2014 - 2018  |  GPA: 3.7/4.0", 11),
    ("F1", "Relevant coursework: Data Structures, Operating Systems, Databases, ML Basics", 11),
    ("F3", "", 10),
    ("F2", "PROJECTS", 13),
    ("F1", "- OpenBoard (github.com/alexmorgan/openboard): Real-time collaborative whiteboard", 11),
    ("F1", "  built with WebSockets and React; 1.2k GitHub stars.", 11),
    ("F1", "- cli-tools (github.com/alexmorgan/cli-tools): Python CLI utilities package with", 11),
    ("F1", "  95% test coverage, published on PyPI (5k+ downloads).", 11),
]


def escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def build_content() -> bytes:
    y = 742
    ops: list[str] = []
    for font, text, size in LINES:
        if text:
            ops.append(
                f"BT /{font} {size} Tf 56 {y} Td ({escape(text)}) Tj ET"
            )
        y -= size + 8 if size >= 13 else 14
        if y < 60:
            break
    return "\n".join(ops).encode("latin-1")


def build_pdf(content: bytes) -> bytes:
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_pos = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n"
    ).encode()
    return bytes(out)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(build_pdf(build_content()))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
