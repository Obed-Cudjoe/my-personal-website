#!/usr/bin/env python3
"""
Reusable PDF report template generator for the Digital Marketplace launch plan.
Parses the step markdown files (step-1-*.md, step-2-*.md) and renders a
professional A4 PDF: cover page, contents, styled sections, tables, callouts,
checklists, running headers and page numbers.

Usage:  python3 tools/report_pdf_template.py [--step 1|2|all]
Deps:   reportlab (fonts: DejaVu Sans, present on most Linux systems)
"""
import os, re, argparse

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, NextPageTemplate, KeepTogether)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas

# ---------------------------------------------------------------- palette
NAVY = colors.HexColor('#0F1B33')
TEAL = colors.HexColor('#12B886')
TEAL_SOFT = colors.HexColor('#E6FAF2')
AMBER = colors.HexColor('#F59F00')
AMBER_SOFT = colors.HexColor('#FFF4D6')
RED = colors.HexColor('#E03131')
RED_SOFT = colors.HexColor('#FFE3E3')
BLUE = colors.HexColor('#1C7ED6')
BLUE_SOFT = colors.HexColor('#E7F5FF')
INDIGO = colors.HexColor('#3B5BDB')
INK = colors.HexColor('#1F2937')
MUTED = colors.HexColor('#6B7280')
LINE = colors.HexColor('#E5E7EB')
SOFT = colors.HexColor('#F8FAFC')
WHITE = colors.white
NAVY_SOFT = colors.HexColor('#2A3D66')

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------------------------------------------------------------- fonts
FDIR = '/usr/share/fonts/truetype/dejavu'
pdfmetrics.registerFont(TTFont('DejaVu', os.path.join(FDIR, 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', os.path.join(FDIR, 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuMono', os.path.join(FDIR, 'DejaVuSansMono.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold',
                              italic='DejaVu', boldItalic='DejaVu-Bold')

PAGE_W, PAGE_H = A4
M_L, M_R, M_T, M_B = 1.7*cm, 1.7*cm, 2.1*cm, 1.9*cm
USABLE_W = PAGE_W - M_L - M_R

# ---------------------------------------------------------------- styles
def st(name, **kw):
    base = dict(fontName='DejaVu', fontSize=9.3, leading=13.6, textColor=INK, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    'cover-step': st('cover-step', fontName='DejaVu-Bold', fontSize=11, leading=14, textColor=colors.HexColor('#9FB6E8')),
    'cover-title': st('cover-title', fontName='DejaVu-Bold', fontSize=26, leading=32, textColor=WHITE),
    'cover-sub': st('cover-sub', fontSize=12, leading=17.5, textColor=colors.HexColor('#C9D6F2')),
    'chip': st('chip', fontSize=8.8, leading=12, textColor=colors.HexColor('#E8EEFC')),
    'h2p': st('H2-para', fontName='DejaVu-Bold', fontSize=14.5, leading=18, textColor=NAVY),
    'h3': st('h3', fontName='DejaVu-Bold', fontSize=11.5, leading=15, textColor=INDIGO, spaceBefore=10, spaceAfter=5),
    'sub': st('sub', fontSize=9, leading=12.5, textColor=MUTED),
    'body': st('body', spaceAfter=7),
    'bullet': st('bullet', spaceAfter=4, leftIndent=14, bulletIndent=4),
    'dash': st('dash', spaceAfter=4, leftIndent=16, bulletIndent=6),
    'cell': st('cell', fontSize=8.2, leading=11),
    'cellh': st('cellh', fontSize=8.2, leading=11, textColor=WHITE, fontName='DejaVu-Bold'),
    'callout-t': st('callout-t', fontName='DejaVu-Bold', fontSize=8.6, leading=11, textColor=NAVY),
    'callout-b': st('callout-b', fontSize=8.8, leading=12.4, textColor=INK),
    'check': st('check', fontSize=8.8, leading=12.6, leftIndent=18, spaceAfter=4.5),
    'cover-foot': st('cover-foot', fontSize=8.6, leading=12, textColor=colors.HexColor('#9FB6E8')),
}

# ---------------------------------------------------------------- markdown mini-parser
INLINE_B = re.compile(r'\*\*(.+?)\*\*')
INLINE_I = re.compile(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)')
INLINE_C = re.compile(r'`([^`]+)`')

def inline(text):
    text = str(text)
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    text = INLINE_C.sub(r'<font face="DejaVuMono" size="7.8">\1</font>', text)
    text = INLINE_B.sub(r'<b>\1</b>', text)
    text = INLINE_I.sub(r'<i>\1</i>', text)
    return text

def split_row(line):
    line = line.strip()
    if line.startswith('|'): line = line[1:]
    if line.endswith('|'): line = line[:-1]
    return [c.strip() for c in line.split('|')]

def parse_md(path):
    """Return blocks: ('h2'|'h3'|'h1'|'table'|'mixed', payload)."""
    blocks, cur = [], []

    def flush():
        if cur:
            blocks.append(('mixed', list(cur)))
            cur.clear()

    with open(path, encoding='utf-8') as f:
        lines = f.read().splitlines()

    i = 0
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            flush(); i += 1; continue
        if ln.startswith('### '):
            flush(); blocks.append(('h3', ln[4:].strip())); i += 1; continue
        if ln.startswith('## '):
            flush(); blocks.append(('h2', ln[3:].strip())); i += 1; continue
        if ln.startswith('# '):
            flush(); blocks.append(('h1', ln[2:].strip())); i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                r = split_row(lines[i])
                if not all(re.fullmatch(r'-{2,}(?::?-{2,}:?)?', c or '') for c in r):
                    rows.append(r)
                i += 1
            flush(); blocks.append(('table', rows)); continue
        if ln.startswith('- [ ]'):
            cur.append(('c', ln[6:].strip())); i += 1; continue
        if ln.startswith('- ') or ln.startswith('* '):
            cur.append(('b', ln[2:].strip())); i += 1; continue
        if re.match(r'^\d+\.\s+', ln):
            cur.append(('n', re.sub(r'^\d+\.\s+', '', ln))); i += 1; continue
        if ln.startswith('>'):
            cur.append(('q', ln[1:].strip())); i += 1; continue
        cur.append(('p', ln)); i += 1
    flush()
    return blocks

# ---------------------------------------------------------------- canvas with header/footer
class NumberedCanvas(pdfcanvas.Canvas):
    def __init__(self, *a, doc_meta=None, **kw):
        super().__init__(*a, **kw)
        self._saved = []
        self.meta = doc_meta or {}
    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()
    def save(self):
        n = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self._decorate(n)
            super().showPage()
        super().save()
    def _decorate(self, total):
        if self._pageNumber > 1:
            self.saveState()
            self.setStrokeColor(LINE); self.setLineWidth(0.7)
            self.line(M_L, PAGE_H - 1.55*cm, PAGE_W - M_R, PAGE_H - 1.55*cm)
            self.setFont('DejaVu', 7.6); self.setFillColor(MUTED)
            self.drawString(M_L, PAGE_H - 1.35*cm, self.meta.get('header_left', ''))
            self.drawRightString(PAGE_W - M_R, PAGE_H - 1.35*cm, self.meta.get('header_right', ''))
            self.setFont('DejaVu', 7.6)
            self.drawString(M_L, 1.05*cm, self.meta.get('footer_left', ''))
            self.drawRightString(PAGE_W - M_R, 1.05*cm, f"Page {self._pageNumber} of {total}")
            self.setFillColor(TEAL)
            self.rect(M_L, 1.45*cm, USABLE_W, 2.2, stroke=0, fill=1)
            self.restoreState()

# ---------------------------------------------------------------- doc template (TOC support)
class ReportDoc(BaseDocTemplate):
    def __init__(self, fn, meta):
        super().__init__(fn, pagesize=A4, leftMargin=M_L, rightMargin=M_R,
                         topMargin=M_T, bottomMargin=M_B,
                         title=meta['title'], author=meta.get('author', 'Obed Cudjoe'),
                         subject=meta.get('subject', ''))
        self.meta = meta
        cover_frame = Frame(M_L, M_B, USABLE_W, PAGE_H - M_T - M_B, id='cover')
        body_frame = Frame(M_L, M_B, USABLE_W, PAGE_H - M_T - M_B - 0.4*cm, id='body')
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=[cover_frame], onPage=self._draw_cover_bg),
            PageTemplate(id='Body', frames=[body_frame]),
        ])
    def _draw_cover_bg(self, canv, doc):
        canv.saveState()
        canv.setFillColor(NAVY)
        canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canv.setFillColor(TEAL)
        canv.rect(0, PAGE_H - 0.32*cm, PAGE_W, 0.32*cm, stroke=0, fill=1)
        canv.setFillColor(colors.HexColor('#1C3D8F'))
        canv.circle(PAGE_W - 1.2*cm, 1.2*cm, 3.2*cm, stroke=0, fill=1)
        canv.circle(M_L + 0.4*cm, PAGE_H - 1.2*cm, 1.7*cm, stroke=0, fill=1)
        canv.restoreState()
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'H2-para':
            self.notify('TOCEntry', (0, flowable.getPlainText(), self.page))

# ---------------------------------------------------------------- flowable builders
H2_RE = re.compile(r'^(\d+[A-Za-z]?\.?)\s+(.*)$')

def section_header(num_badge, title_txt, sub=None, numbered=True):
    if numbered:
        p = Paragraph(f'<font color="#12B886"><b>{num_badge}</b></font>&nbsp;&nbsp;<b>{inline(title_txt)}</b>', S['h2p'])
    else:
        p = Paragraph(inline(title_txt), st('h2-sub', fontName='DejaVu-Bold', fontSize=11, leading=15, textColor=INDIGO, spaceBefore=2, spaceAfter=2))
    rule = Table([['']], colWidths=[USABLE_W], rowHeights=[0.05*cm])
    rule.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), NAVY if numbered else LINE)]))
    flow = [KeepTogether([p, Spacer(1, 0.08*cm), rule])]
    if sub:
        flow += [Spacer(1, 0.22*cm), Paragraph(inline(sub), S['sub'])]
    flow.append(Spacer(1, 0.32*cm))
    return flow

def table_flowable(rows, minwidths=None):
    if not rows:
        return None
    ncols = len(rows[0])
    header, data = rows[0], rows[1:]

    def est(cell):
        t = re.sub(r'\*\*|`', '', str(cell))
        return max(len(t) * 0.9, 24)

    ratios = []
    for c in range(ncols):
        m = max([est(r[c]) for r in rows] + [len(header[c]) * 0.9])
        if minwidths:
            m = max(m, minwidths[c])
        ratios.append(m)
    avail = USABLE_W - 0.5*cm
    widths = [max(avail * (r / sum(ratios)), 1.1*cm) for r in ratios]
    over = sum(widths) - avail
    if over > 0:
        widths = [w - over * (w / sum(widths)) for w in widths]

    head = [[Paragraph(inline(c), S['cellh']) for c in header]]
    body = [[Paragraph(inline(c), S['cell']) for c in row] for row in data]
    t = Table(head + body, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SOFT]),
        ('LINEBELOW', (0,0), (-1,-1), 0.4, LINE),
        ('LINEABOVE', (0,0), (-1,0), 0.9, NAVY),
        ('LINEBELOW', (0,0), (-1,0), 0.7, colors.HexColor('#2A3D66')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4.5), ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def callout_flowable(lines):
    colors_map = {'teal': (TEAL, TEAL_SOFT), 'amber': (AMBER, AMBER_SOFT),
                  'blue': (BLUE, BLUE_SOFT), 'red': (RED, RED_SOFT)}
    title, rest = None, lines
    first = lines[0] if lines else ''
    if first.startswith('**') and '**' in first[2:]:
        parts = first.split('**', 2)
        title = parts[1]
        rest = ([parts[2].strip()] if len(parts) > 2 and parts[2].strip() else []) + lines[1:]
    # detect kind by title keywords
    kind = 'teal'
    if title:
        tl = title.lower()
        if any(k in tl for k in ('note', 'scheduled')):
            kind = 'blue'
        elif any(k in tl for k in ('warning', 'risk', 'caution')):
            kind = 'red'
        elif 'why' in tl:
            kind = 'teal'
    bar, bg = colors_map[kind]
    paras = []
    if title:
        paras.append(Paragraph(f'<b>{inline(title)}</b>', S['callout-t']))
    for l in rest:
        if l.strip():
            paras.append(Paragraph(inline(l), S['callout-b']))
    t = Table([[paras]], colWidths=[USABLE_W - 0.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('LINEBEFORE', (0,0), (0,-1), 0.16*cm, bar),
        ('TOPPADDING', (0,0), (-1,-1), 8), ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12), ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def cover_flowables(meta):
    els = [Spacer(1, 3.0*cm)]
    if meta.get('step'):
        els.append(Paragraph(meta['step'], S['cover-step']))
        els.append(Spacer(1, 0.45*cm))
    els.append(Paragraph(meta['title'], S['cover-title']))
    els.append(Spacer(1, 0.55*cm))
    bar = Table([['']], colWidths=[2.4*cm], rowHeights=[0.14*cm])
    bar.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), TEAL)]))
    els.append(bar)
    els.append(Spacer(1, 0.55*cm))
    els.append(Paragraph(meta['subtitle'], S['cover-sub']))
    els.append(Spacer(1, 1.7*cm))
    chips = [[Paragraph(c, S['chip'])] for c in meta.get('chips', [])]
    ct = Table(chips, colWidths=[9.0*cm])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY_SOFT),
        ('BOX', (0,0), (-1,-1), 0.6, colors.HexColor('#FFFFFF40')),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
    ]))
    els.append(ct)
    els.append(Spacer(1, 2.4*cm))
    els.append(Paragraph(meta.get('footer_cover', ''), S['cover-foot']))
    els.append(NextPageTemplate('Body'))
    els.append(PageBreak())
    return els

def mixed_flowables(items):
    """Convert a 'mixed' block (list of tagged items) to flowables."""
    out, i = [], 0
    while i < len(items):
        item = items[i]
        tag, txt = item if isinstance(item, tuple) else ('p', item)
        if tag == 'b':
            out.append(Paragraph(inline(txt), S['bullet'], bulletText='•')); i += 1
        elif tag == 'n':
            out.append(Paragraph(inline(txt), S['dash'], bulletText='–')); i += 1
        elif tag == 'p':
            out.append(Paragraph(inline(txt), S['body'])); i += 1
        elif tag == 'c':
            out.append(Paragraph(f'<font color="#12B886" size="9">✔</font>&nbsp;&nbsp;{inline(txt)}', S['check']))
            i += 1
        elif tag == 'q':
            qs = []
            while i < len(items) and isinstance(items[i], tuple) and items[i][0] == 'q':
                qs.append(items[i][1]); i += 1
            out.append(callout_flowable(qs))
            out.append(Spacer(1, 0.18*cm))
        else:
            i += 1
    return out

# ---------------------------------------------------------------- build
def build_pdf(meta):
    blocks = parse_md(meta['md'])
    story = cover_flowables(meta)
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle('TOC1', fontName='DejaVu-Bold', fontSize=10.5, leading=17, textColor=NAVY)]
    story.append(Spacer(1, 0.3*cm))
    story += section_header('', 'Contents', numbered=False)
    story.append(Spacer(1, 0.3*cm))
    story.append(toc)
    story.append(PageBreak())

    for kind, payload in blocks:
        if kind == 'h1':
            continue
        if kind == 'h2':
            m = H2_RE.match(payload)
            if m:
                story += section_header(m.group(1), m.group(2), numbered=True)
            else:
                story += section_header('', payload, numbered=False)
            story.append(Spacer(1, 0.12*cm))
        elif kind == 'h3':
            story.append(Paragraph(f'<b>{inline(payload)}</b>', S['h3']))
            story.append(Spacer(1, 0.08*cm))
        elif kind == 'table':
            t = table_flowable(payload)
            if t:
                story.append(t)
                story.append(Spacer(1, 0.25*cm))
        elif kind == 'mixed':
            story += mixed_flowables(payload)
            story.append(Spacer(1, 0.12*cm))

    doc = ReportDoc(meta['out'], meta)
    doc.multiBuild(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_meta=meta, **k))
    print(f"Built {meta['out']}")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--step', default='all', choices=['1', '2', 'all'])
    args = ap.parse_args()

    common = dict(header_left='Digital Marketplace Launch Plan',
                  header_right='Cudjoe Digital Studio')

    docs = []
    if args.step in ('1', 'all'):
        docs.append(dict(
            step='Market Research & Audience Pain Points · Step 1 of 5',
            title='Market Research & Audience Pain Points',
            subtitle='What professionals who use AI — and professionals who buy ebooks — actually complain about, what they will pay for, and exactly which prompt packs and ebooks a new digital store should launch first.',
            chips=['Date: August 25, 2026', 'Scope: 8 platforms · 62 documented pain points',
                   'Product: AI prompt packs + practical ebooks', 'Prepared for: Marketplace launch plan'],
            out=os.path.join(ROOT, 'market-research', 'step-1-pain-point-research-report.pdf'),
            md=os.path.join(ROOT, 'market-research', 'step-1-pain-point-research-report.md'),
            footer_left='Step 1 — Market Research & Audience Pain Points',
            footer_cover='Step 1 of 5 · Market Research & Audience Pain Points',
            subject='Pain-point research for the digital marketplace launch', **common))
    if args.step in ('2', 'all'):
        docs.append(dict(
            step='Product Catalog Plan & Pricing Strategy · Step 2 of 5',
            title='Product Catalog Plan & Pricing Strategy',
            subtitle='The complete launch inventory: 15 prompt packs across 5 job categories, 5 practical ebooks, 3 bundles at a visible discount, free lead magnets, quality standards — and the roadmap to scale it.',
            chips=['Date: August 25, 2026', 'Inventory: 25 sellable products + 2 lead magnets',
                   'Currency: GH₵ · ≈ $1 = GH₵ 11.15', 'Total catalog value: GH₵ 2,710'],
            out=os.path.join(ROOT, 'market-research', 'step-2-product-catalog-plan.pdf'),
            md=os.path.join(ROOT, 'market-research', 'step-2-product-catalog-plan.md'),
            footer_left='Step 2 — Product Catalog Plan & Pricing Strategy',
            footer_cover='Step 2 of 5 · Product Catalog Plan & Pricing Strategy',
            subject='Product catalog and pricing strategy for the digital marketplace launch', **common))

    for meta in docs:
        build_pdf(meta)
