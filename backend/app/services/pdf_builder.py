"""Turn the AI's simple markdown resume into a PDF with the same layout as the .docx."""
from fpdf import FPDF

from .docx_builder import BULLET

ACCENT = (0x1F, 0x3A, 0x8A)
MUTED = (0x55, 0x5B, 0x6E)
TEXT = (0x11, 0x11, 0x11)

# The built-in PDF fonts only cover Latin-1, so map common typographic characters.
_REPLACEMENTS = str.maketrans({
    "–": "-", "—": "-", "‒": "-", "−": "-",
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "•": "-", "…": "...", " ": " ", "​": "",
})


def _latin1(text: str) -> str:
    return text.translate(_REPLACEMENTS).encode("latin-1", "replace").decode("latin-1")


def _write(pdf: FPDF, text: str, size: float, color=TEXT, align: str = "L", bold: bool = False):
    """Write a wrapped paragraph, rendering **bold** segments as bold."""
    pdf.set_text_color(*color)
    pdf.set_font("Helvetica", "B" if bold else "", size)
    if bold or "**" not in text:
        pdf.multi_cell(0, size * 0.5, _latin1(text.replace("**", "")), align=align,
                       new_x="LMARGIN", new_y="NEXT")
        return
    # fpdf2's markdown mode understands **bold**.
    pdf.multi_cell(0, size * 0.5, _latin1(text), align=align, markdown=True,
                   new_x="LMARGIN", new_y="NEXT")


def build_pdf(markdown: str) -> bytes:
    pdf = FPDF(format="A4", unit="mm")
    pdf.set_margins(19, 15, 19)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    in_header = True  # lines between the name and the first section are contact info
    for raw in markdown.splitlines():
        line = raw.strip()
        if not line or line.startswith("```"):
            continue

        if line.startswith("# "):
            _write(pdf, line[2:].strip(), 20, ACCENT, align="C", bold=True)
            pdf.ln(1)
        elif line.startswith("## "):
            in_header = False
            pdf.ln(3)
            _write(pdf, line[3:].strip().upper(), 12, ACCENT, bold=True)
            pdf.set_draw_color(*ACCENT)
            pdf.set_line_width(0.3)
            pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
            pdf.ln(2)
        elif line.startswith("### "):
            in_header = False
            pdf.ln(1.5)
            _write(pdf, line[4:].strip(), 11, bold=True)
        elif match := BULLET.match(line):
            pdf.set_text_color(*TEXT)
            pdf.set_font("Helvetica", "", 10.5)
            pdf.cell(5, 5.25, "-")
            pdf.set_x(pdf.l_margin + 5)
            pdf.set_left_margin(pdf.l_margin + 5)
            _write(pdf, match.group(1).strip(), 10.5)
            pdf.set_left_margin(pdf.l_margin - 5)
            pdf.ln(0.5)
        elif in_header:
            _write(pdf, line, 9.5, MUTED, align="C")
        else:
            _write(pdf, line, 10.5)
            pdf.ln(1)

    return bytes(pdf.output())
