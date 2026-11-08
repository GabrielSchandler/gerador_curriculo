from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "jobs.json"
OUT = ROOT / "public" / "generated" / "curriculos"

NAVY = "17324D"
BLUE = "2F6F9F"
SLATE = "536273"
LIGHT_BLUE = "EAF2F8"
LIGHT_GRAY = "F5F7FA"
BORDER = "D7E0E8"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, **kwargs) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        if edge in kwargs:
            tag = "w:%s" % edge
            element = borders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                borders.append(element)
            for key in ["val", "sz", "space", "color"]:
                if key in kwargs[edge]:
                    element.set(qn("w:%s" % key), str(kwargs[edge][key]))


def set_font(run, name="Aptos", size=10.2, color="25364A", bold=False, italic=False):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold
    run.italic = italic


def set_paragraph_spacing(paragraph, before=0, after=5, line=1.08):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line


def add_bottom_border(paragraph, color=BORDER, size="8"):
    p = paragraph._p
    p_pr = p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)


def configure_document(doc: Document):
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.35)
    section.bottom_margin = Cm(1.35)
    section.left_margin = Cm(1.55)
    section.right_margin = Cm(1.55)
    section.header_distance = Cm(0.65)
    section.footer_distance = Cm(0.65)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(10.2)
    normal.font.color.rgb = RGBColor.from_string("25364A")
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.08

    for name, size, color in (("Heading 1", 12.5, NAVY), ("Heading 2", 10.8, BLUE)):
        style = styles[name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(8)
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.keep_with_next = True

    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, after=0, line=1)
    r = p.add_run("Gabriel Marques Schandler  ·  Currículo profissional")
    set_font(r, size=8.2, color=SLATE)


def parse_resume(markdown: str):
    lines = [line.rstrip() for line in str(markdown or "").splitlines()]
    name = "Gabriel Marques Schandler"
    sections = []
    current = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("# "):
            name = line[2:].strip()
        elif line.lower().startswith("**contato") or line.lower().startswith("contato:"):
            current = {"title": "Contato", "items": []}
            sections.append(current)
        elif line.startswith("## "):
            current = {"title": line[3:].strip(), "items": []}
            sections.append(current)
        elif line.startswith("### "):
            if current is None:
                current = {"title": "Experiência profissional", "items": []}
                sections.append(current)
            current["items"].append({"kind": "role", "text": line[4:].strip()})
        elif line.startswith("- ") or line.startswith("• "):
            if current is None:
                current = {"title": "Informações", "items": []}
                sections.append(current)
            current["items"].append({"kind": "bullet", "text": line[2:].strip()})
        elif current is not None:
            current["items"].append({"kind": "text", "text": line.strip("*")})
    return name, sections


def clean_inline(text: str) -> str:
    text = re.sub(r"\[([^]]+)\]\(([^)]+)\)", r"\1", str(text))
    text = text.replace("**", "").replace("__", "")
    return text.strip()


def add_bullet(doc, text):
    p = doc.add_paragraph(style="Normal")
    p.paragraph_format.left_indent = Cm(0.35)
    p.paragraph_format.first_line_indent = Cm(-0.22)
    set_paragraph_spacing(p, after=2, line=1.06)
    r = p.add_run("• ")
    set_font(r, size=9.8, color=BLUE, bold=True)
    r = p.add_run(clean_inline(text))
    set_font(r, size=9.8)
    return p


def add_contact_line(doc, text):
    text = clean_inline(text)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_paragraph_spacing(p, after=3, line=1)
    r = p.add_run(text)
    set_font(r, size=8.7, color=SLATE)
    return p


def build_doc(job: dict, path: Path):
    doc = Document()
    configure_document(doc)
    name, sections = parse_resume(job.get("resume", ""))

    title = doc.add_paragraph()
    set_paragraph_spacing(title, after=0, line=1)
    r = title.add_run(name)
    set_font(r, name="Aptos Display", size=23, color=NAVY, bold=True)

    role = doc.add_paragraph()
    set_paragraph_spacing(role, after=5, line=1)
    r = role.add_run(job.get("title") or "Profissional de Planejamento e Operações")
    set_font(r, name="Aptos", size=11.5, color=BLUE, bold=True)
    add_bottom_border(role)

    contact = None
    for sec in sections:
        if sec["title"].lower().startswith("contato"):
            contact = sec
            break
    if contact:
        contact_items = [item["text"] for item in contact["items"] if item["kind"] in ("bullet", "text")]
        clean = []
        for item in contact_items:
            item = re.sub(r"\*+", "", item).strip()
            if item:
                clean.append(item)
        if clean:
            add_contact_line(doc, "  ·  ".join(clean))
        sections = [s for s in sections if s is not contact]

    for sec in sections:
        heading = sec["title"].strip().replace("Versão para revisão — candidatura não enviada.", "").strip()
        if not heading or heading.lower() in {"versão para revisão", "contato"}:
            continue
        p = doc.add_paragraph(style="Heading 1")
        r = p.add_run(heading)
        set_font(r, name="Aptos Display", size=12.5, color=NAVY, bold=True)
        for item in sec["items"]:
            text = item["text"].strip()
            if not text or "Versão para revisão" in text:
                continue
            if item["kind"] == "role":
                p = doc.add_paragraph()
                set_paragraph_spacing(p, before=3, after=1, line=1.04)
                r = p.add_run(clean_inline(text))
                set_font(r, size=10.2, color=NAVY, bold=True)
            elif item["kind"] == "bullet":
                add_bullet(doc, text)
            else:
                p = doc.add_paragraph()
                set_paragraph_spacing(p, after=3, line=1.06)
                r = p.add_run(clean_inline(text))
                set_font(r, size=9.8, color=SLATE if heading.lower() == "contato" else "25364A")

    doc.core_properties.author = "Gabriel Marques Schandler"
    doc.core_properties.title = f"Currículo - {job.get('title') or 'Perfil profissional'}"
    doc.core_properties.subject = "Currículo profissional adaptado para candidatura"
    doc.save(path)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = json.loads(DATA.read_text(encoding="utf-8"))
    requested_ids = set(sys.argv[1:])
    if requested_ids:
        jobs = [job for job in jobs if job.get("id") in requested_ids]
    for job in jobs:
        if job.get("id") and job.get("resume"):
            build_doc(job, OUT / f"{job['id']}.docx")
    print(f"generated={sum(1 for job in jobs if job.get('id') and job.get('resume'))}")


if __name__ == "__main__":
    main()
