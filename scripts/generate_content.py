#!/usr/bin/env python3
"""Generate all product files for the digital marketplace:
- prompt packs -> .docx + .pdf + sample.txt
- ebooks -> .pdf + .epub + chapter1.pdf (sample) + cover.jpg (if missing)
- lead magnets -> free-prompts.docx/pdf, free-chapter.pdf
- bundles -> bundle.zip from component files
Run: python3 scripts/generate_content.py
"""
import os, sys, json, zipfile, hashlib
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from content_packs import PACKS, EXTRA_PACKS
from content_ebooks import EBOOKS, EXTRA_EBOOKS

PACKS = PACKS + EXTRA_PACKS
EBOOKS = EBOOKS + EXTRA_EBOOKS

STORAGE = os.path.join(ROOT, "storage")
os.makedirs(STORAGE, exist_ok=True)

# ---------------------------------------------------------------- DOCX (minimal OOXML)
def build_docx(path, title, intro, prompts):
    """Build a valid .docx from prompt data (no external deps)."""
    paras = []
    paras.append(("<w:p><w:pPr><w:pStyle w:val=\"Title\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr>"
                  f"<w:t xml:space=\"preserve\">{escape(title)}</w:t></w:r></w:p>"))
    for line in intro.split("\n"):
        paras.append(f"<w:p><w:r><w:t xml:space=\"preserve\">{escape(line)}</w:t></w:r></w:p>")
    for i, p in enumerate(prompts, 1):
        paras.append(f"<w:p><w:pPr><w:pStyle w:val=\"Heading1\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr>"
                     f"<w:t xml:space=\"preserve\">{i}. {escape(p['title'])}</w:t></w:r></w:p>")
        for label, key in [("When to use", "when"), ("Prompt", "prompt"),
                           ("Customize", "customize"), ("What good looks like", "output")]:
            paras.append(f"<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space=\"preserve\">{label}:</w:t></w:r></w:p>")
            paras.append(f"<w:p><w:r><w:t xml:space=\"preserve\">{escape(p[key])}</w:t></w:r></w:p>")

    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:body>' + "".join(paras) +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" '
        'w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        '</Types>'
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '</Relationships>'
    )
    styles = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:before="240" w:after="240"/></w:pPr>'
        '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="48"/><w:b/></w:rPr></w:style>'
        '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>'
        '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="32"/><w:b/></w:rPr></w:style>'
        '</w:styles>'
    )
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", document_xml)
        z.writestr("word/styles.xml", styles)
    return path

# ---------------------------------------------------------------- PDF (reportlab)
def build_pdf(path, title, subtitle, sections, page_w=595, page_h=842):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                    Table, TableStyle, PageBreak)
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    FDIR = "/usr/share/fonts/truetype/dejavu"
    pdfmetrics.registerFont(TTFont("DVS", os.path.join(FDIR, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DVSB", os.path.join(FDIR, "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("DVM", os.path.join(FDIR, "DejaVuSansMono.ttf")))

    NAVY = colors.HexColor("#0f1b33")
    TEAL = colors.HexColor("#12b886")
    INK = colors.HexColor("#1f2937")
    MUT = colors.HexColor("#6b7280")

    st_title = ParagraphStyle("t", fontName="DVSB", fontSize=26, leading=32, textColor=NAVY)
    st_sub = ParagraphStyle("s", fontName="DVS", fontSize=12, leading=17, textColor=MUT)
    st_h1 = ParagraphStyle("h1", fontName="DVSB", fontSize=15, leading=20, textColor=NAVY, spaceBefore=14, spaceAfter=6)
    st_b = ParagraphStyle("b", fontName="DVS", fontSize=10, leading=15, textColor=INK, spaceAfter=6)
    st_label = ParagraphStyle("l", fontName="DVSB", fontSize=9, leading=13, textColor=TEAL, spaceBefore=8)
    st_mono = ParagraphStyle("m", fontName="DVM", fontSize=8.6, leading=12.5, textColor=INK,
                             backColor=colors.HexColor("#f1f5f9"), borderPadding=8, spaceAfter=8)

    doc = SimpleDocTemplate(path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
                            title=title, author="Cudjoe Digital Studio")
    story = [Paragraph(title, st_title), Spacer(1, 4), Paragraph(subtitle, st_sub),
             Spacer(1, 10), Table([[""]], colWidths=[5*cm], rowHeights=[0.06*cm]),
             Spacer(1, 16)]
    for sec in sections:
        if sec[0] == "chapter":
            story.append(PageBreak())
            story.append(Paragraph(sec[1], st_h1))
            for para in sec[2]:
                story.append(Paragraph(para, st_b))
        elif sec[0] == "prompt":
            story.append(Paragraph(sec[1], st_h1))
            story.append(Paragraph("WHEN TO USE", st_label))
            story.append(Paragraph(sec[2], st_b))
            story.append(Paragraph("THE PROMPT", st_label))
            story.append(Paragraph(sec[3].replace("\n", "<br/>"), st_mono))
            story.append(Paragraph("CUSTOMIZE", st_label))
            story.append(Paragraph(sec[4], st_b))
            story.append(Paragraph("WHAT GOOD LOOKS LIKE", st_label))
            story.append(Paragraph(sec[5], st_b))
    doc.build(story)

# ---------------------------------------------------------------- EPUB
def build_epub(path, title, subtitle, author, chapters):
    """Build a minimal valid EPUB3 (no external deps)."""
    epub_id = "urn:uuid:" + hashlib.md5(path.encode()).hexdigest()
    content = []
    for i, ch in enumerate(chapters):
        body = "".join(f"<p>{escape(p)}</p>" for p in ch["paras"])
        content.append(
            f'<?xml version="1.0" encoding="utf-8"?>'
            f'<html xmlns="http://www.w3.org/1999/xhtml"><head><title>{escape(ch["title"])}</title></head>'
            f'<body><h1>{escape(ch["title"])}</h1>{body}</body></html>'
        )
    nav_items = "".join(
        f'<li><a href="chap{i+1}.xhtml">{escape(ch["title"])}</a></li>'
        for i, ch in enumerate(chapters)
    )
    nav_xhtml = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">'
        '<head><title>Contents</title></head><body><nav epub:type="toc"><ol>'
        + nav_items + "</ol></nav></body></html>"
    )
    opf = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:identifier id="pub-id">{epub_id}</dc:identifier>'
        f'<dc:title>{escape(title)}</dc:title>'
        f'<dc:creator>{escape(author)}</dc:creator>'
        '<dc:language>en</dc:language>'
        '<meta property="dcterms:modified">2026-08-25T00:00:00Z</meta>'
        '</metadata>'
        '<manifest>'
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
        + "".join(f'<item id="c{i+1}" href="chap{i+1}.xhtml" media-type="application/xhtml+xml"/>' for i in range(len(chapters))) +
        '</manifest>'
        '<spine>' + "".join(f'<itemref idref="c{i+1}"/>' for i in range(len(chapters))) + "</spine>"
        '</package>'
    )
    container = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
    )
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", container)
        for i, c in enumerate(content):
            z.writestr(f"OEBPS/chap{i+1}.xhtml", c)
        z.writestr("OEBPS/nav.xhtml", nav_xhtml)
        z.writestr("OEBPS/content.opf", opf)

# ---------------------------------------------------------------- build packs
def build_packs():
    for pack in PACKS:
        d = os.path.join(STORAGE, "prompts", pack["id"])
        os.makedirs(d, exist_ok=True)
        build_docx(os.path.join(d, "pack.docx"), pack["title"], pack["intro"], pack["prompts"])
        sections = [("chapter", pack["title"], [pack["intro"], f"Prompt count: {pack['count']} · Category: {pack['category']} · Price: GH₵ {pack['price']}"])]
        for p in pack["prompts"]:
            sections.append(("prompt", p["title"], p["when"], p["prompt"], p["customize"], p["output"]))
        build_pdf(os.path.join(d, "pack.pdf"), pack["title"], "Tested AI prompt pack — Word + PDF", sections)
        # sample.txt: first 3 prompts
        sample = f"{pack['title']}\n\n"
        for p in pack["prompts"][:3]:
            sample += f"### {p['title']}\n{p['prompt']}\n\n"
        with open(os.path.join(d, "sample.txt"), "w", encoding="utf-8") as f:
            f.write(sample)
        print(f"  pack {pack['sku']} -> docx, pdf, sample.txt")

# ---------------------------------------------------------------- build ebooks
def build_ebooks():
    for book in EBOOKS:
        d = os.path.join(STORAGE, "ebooks", book["id"])
        os.makedirs(d, exist_ok=True)
        sections = [("chapter", book["title"], [book["blurb"]])]
        for ch in book["chapters"]:
            sections.append(("chapter", ch["title"], ch["paras"]))
        build_pdf(os.path.join(d, "book.pdf"), book["title"], f"{book['subtitle']} — by {book['author']}", sections)
        build_epub(os.path.join(d, "book.epub"), book["title"], book["subtitle"], book["author"], book["chapters"])
        # sample: chapter 1 PDF
        build_pdf(os.path.join(d, "chapter1.pdf"), book["chapters"][0]["title"],
                  f"Free sample chapter — from '{book['title']}' by {book['author']}",
                  [("chapter", book["chapters"][0]["title"], book["chapters"][0]["paras"])])
        print(f"  ebook {book['sku']} -> pdf, epub, chapter1.pdf")

# ---------------------------------------------------------------- lead magnets
def build_free():
    d = os.path.join(STORAGE, "samples")
    os.makedirs(d, exist_ok=True)
    free_prompts = [
        {"title": "Cold outreach that gets replies", "when": "First message to a prospect.",
         "prompt": "Write a cold outreach message from [ME] to [PROSPECT] at [COMPANY] who [WHY THEY MATTER]. Goal: book a 15-minute call. Lead with one specific observation about their business. Keep under 120 words. Forbidden: 'I hope this finds you well'.",
         "customize": "Use a real observation you found in research.",
         "output": "A short message that starts with their world, not yours."},
        {"title": "Proposal that sells the outcome", "when": "Sending a proposal.",
         "prompt": "Write a project proposal for [CLIENT] for [PROJECT]. Client's goal: [GOAL]. Approach: [2-3 SENTENCES]. Timeline: [X] weeks. Budget: GH₵ [AMOUNT]. Structure: outcome, week-by-week deliverables, what you need from them, two pricing options.",
         "customize": "Add one line they said in your discovery call.",
         "output": "A proposal a busy owner can approve in 2 minutes."},
        {"title": "Scope-creep response", "when": "Client asks for extra work.",
         "prompt": "Write a reply to [CLIENT] who asked for [EXTRA WORK] outside our agreement covering [SCOPE]. Acknowledge, explain it's outside scope, offer it as a paid addition at GH₵ [AMOUNT]. Give a simple yes/no choice. Tone: helpful, not apologetic. Under 120 words.",
         "customize": "Price the addition immediately.",
         "output": "Extra work becomes a business decision, not a favour."},
        {"title": "Invoice chase — first reminder", "when": "Invoice 1-2 days late.",
         "prompt": "Write a friendly first reminder for invoice [#NUMBER] of GH₵ [AMOUNT] for [PROJECT], due [DATE]. Assume oversight, not malice. Two sentences + payment details. Tone: light, zero accusation.",
         "customize": "Send within 48 hours of the due date.",
         "output": "A nudge that gets most invoices paid within a day."},
        {"title": "Testimonial request without the cringe", "when": "Happy client, delivered project.",
         "prompt": "Write a short message asking [CLIENT] for a testimonial after [PROJECT]. Remind them of the result in one line, give 3 fill-in-the-blank sentence starters, ask permission to publish. Tone: warm, no pressure.",
         "customize": "Name the actual result.",
         "output": "A request so easy the client says yes in 2 minutes."},
    ]
    build_docx(os.path.join(d, "free-prompts.docx"), "5 Free Freelance Prompts That Actually Work",
               "Sample quality from Cudjoe Digital Studio. The same standard as our paid packs — every prompt tested on ChatGPT, Claude and Gemini.", free_prompts)
    build_pdf(os.path.join(d, "free-prompts.pdf"), "5 Free Freelance Prompts That Actually Work",
              "Sample quality from Cudjoe Digital Studio", [("chapter", "5 Free Freelance Prompts", ["The same standard as our paid packs."])] + [
                  ("prompt", p["title"], p["when"], p["prompt"], p["customize"], p["output"]) for p in free_prompts])
    # free chapter: chapter 1 of the freelancer ebook
    book = next(b for b in EBOOKS if b["id"] == "ebk-fre-01")
    build_pdf(os.path.join(d, "free-chapter.pdf"),
              "Why Your AI Proposals Fail (and the 4-line fix)",
              "Free chapter from 'The Freelancer's AI Client Machine' + bonus mini-guide",
              [("chapter", "Why Your AI Proposals Fail (and the 4-line fix)", book["chapters"][0]["paras"]),
               ("chapter", "Bonus mini-guide: The Prompt Recipe — Write Any Prompt in 4 Steps",
                ["1. CONTEXT — who is this for, what do they want, in their words?",
                 "2. CONSTRAINT — length, tone, banned phrases, structure.",
                 "3. VOICE — paste a sample of writing that sounds like you.",
                 "4. OUTPUT FORMAT — list, table, email, script? Ask for exactly what you want back.",
                 "Fill all four steps before pressing send. A prompt with four filled steps beats a 'perfect' prompt with none."])])
    print("  free samples -> free-prompts.docx/pdf, free-chapter.pdf")

# ---------------------------------------------------------------- bundles
def build_bundles():
    with open(os.path.join(ROOT, "content", "bundles.json")) as f:
        bundles = json.load(f)
    for b in bundles:
        files = {}
        for item in b["items"]:
            if item["type"] == "pack":
                p = next(x for x in PACKS if x["id"] == item["id"])
                base = os.path.join(STORAGE, "prompts", p["id"])
                files[f"prompts/{p['sku'].lower()}/pack.docx"] = os.path.join(base, "pack.docx")
                files[f"prompts/{p['sku'].lower()}/pack.pdf"] = os.path.join(base, "pack.pdf")
            else:
                e = next(x for x in EBOOKS if x["id"] == item["id"])
                base = os.path.join(STORAGE, "ebooks", e["id"])
                files[f"ebooks/{e['sku'].lower()}/book.pdf"] = os.path.join(base, "book.pdf")
                files[f"ebooks/{e['sku'].lower()}/book.epub"] = os.path.join(base, "book.epub")
        out_dir = os.path.join(STORAGE, "bundles", b["id"])
        os.makedirs(out_dir, exist_ok=True)
        readme = "\n".join([
            b["title"], f"Order contents — {len(files)} files", "",
            "Thank you for your purchase from Cudjoe Digital Studio.",
            "Prompt packs: open the .docx to edit or the .pdf to read.",
            "Ebooks: the .epub is for Kindle/Kobo/Apple Books; the .pdf prints.",
            "", "Questions? hello@cudjoe.digital",
        ])
        with zipfile.ZipFile(os.path.join(out_dir, "bundle.zip"), "w", zipfile.ZIP_DEFLATED) as z:
            for name, src in files.items():
                z.write(src, name)
            z.writestr("README.txt", readme)
        total = sum(os.path.getsize(s) for s in files.values())
        print(f"  bundle {b['id']} -> bundle.zip ({len(files)} files, {total//1024} KB)")

# ---------------------------------------------------------------- main
if __name__ == "__main__":
    print("Building prompt packs…")
    build_packs()
    print("Building ebooks…")
    build_ebooks()
    print("Building lead magnets…")
    build_free()
    print("Building bundles…")
    build_bundles()
    print("Done.")
