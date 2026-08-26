#!/usr/bin/env python3
"""Step 4 — User Flows & Wireframes PDF generator.
Low-fidelity mobile-first wireframes drawn with reportlab graphics,
reusing the report template (fonts, palette, NumberedCanvas) from
report_pdf_template.py.

Usage: python3 tools/build_step4_pdf.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak,
                                NextPageTemplate, Flowable, KeepTogether)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

from report_pdf_template import (NAVY, TEAL, INDIGO, INK, MUTED, LINE, SOFT, WHITE,
                                 A4, cm, USABLE_W, PAGE_W, PAGE_H, M_L, M_R, M_T, M_B,
                                 NumberedCanvas, inline, table_flowable, st, S)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'market-research', 'step-4-user-flows-and-wireframes.pdf')

GRAY = colors.HexColor('#6b7280')
DARK = colors.HexColor('#2b2b2b')
MID = colors.HexColor('#b9bec6')

# ---------------------------------------------------------------- flowable for drawings
class DFlowable(Flowable):
    def __init__(self, drawing):
        super().__init__()
        self.drawing = drawing
        self.width = drawing.width
        self.height = drawing.height
    def draw(self):
        self.drawing.drawOn(self.canv, 0, 0)

# ---------------------------------------------------------------- wireframe block engine
KINDS = {
    'header':  dict(fill=DARK,    stroke=None,  txt=WHITE, size=6.6, bold=True,  align='l'),
    'hero':    dict(fill=MID,     stroke=None,  txt=colors.HexColor('#333'), size=6.6, bold=True, align='c'),
    'section': dict(fill=None,    stroke=None,  txt=colors.HexColor('#555'), size=6.2, bold=True, align='l'),
    'card':    dict(fill=colors.HexColor('#efefef'), stroke=colors.HexColor('#b5b5b5'), txt=colors.HexColor('#333'), size=6.0, bold=False, align='l'),
    'list':    dict(fill=WHITE,   stroke=colors.HexColor('#b0b0b0'), txt=colors.HexColor('#444'), size=6.0, bold=False, align='l'),
    'btn':     dict(fill=DARK,    stroke=None,  txt=WHITE, size=6.4, bold=True,  align='c'),
    'input':   dict(fill=WHITE,   stroke=colors.HexColor('#999'), txt=colors.HexColor('#888'), size=6.0, bold=False, align='l'),
    'chips':   dict(fill=colors.HexColor('#f2f2f2'), stroke=colors.HexColor('#c9c9c9'), txt=colors.HexColor('#555'), size=5.8, bold=False, align='c'),
    'footer':  dict(fill=colors.HexColor('#e8e8e8'), stroke=colors.HexColor('#d0d0d0'), txt=colors.HexColor('#666'), size=5.8, bold=False, align='c'),
    'txt':     dict(fill=None,    stroke=None,  txt=colors.HexColor('#444'), size=5.8, bold=False, align='l'),
    'price':   dict(fill=None,    stroke=None,  txt=DARK, size=7.6, bold=True, align='c'),
}

def _block(d, x, y, w, h, label, kind, strike=False):
    k = KINDS[kind]
    if k['fill'] is not None:
        d.add(Rect(x, y, w, h, fillColor=k['fill'], strokeColor=k['stroke'] or colors.Color(0, 0, 0, 0), strokeWidth=0.8))
    elif k['stroke'] is not None:
        d.add(Rect(x, y, w, h, fillColor=None, strokeColor=k['stroke'], strokeWidth=0.8))
    lines = label.split('\n')
    lh = 8.2 if k['bold'] else 7.6
    total = len(lines) * lh
    y0 = y + (h + total) / 2 - lh
    for ln in lines:
        if k['align'] == 'c':
            d.add(String(x + w / 2, y0, ln, fontName='DejaVu-Bold' if k['bold'] else 'DejaVu',
                         fontSize=k['size'], fillColor=k['txt'], textAnchor='middle'))
        else:
            d.add(String(x + 5, y0, ln, fontName='DejaVu-Bold' if k['bold'] else 'DejaVu',
                         fontSize=k['size'], fillColor=k['txt']))
        if strike:
            tw = len(ln) * k['size'] * 0.55
            d.add(Line(x + 5, y0 + k['size'] * 0.38, x + 5 + tw, y0 + k['size'] * 0.38,
                       strokeColor=k['txt'], strokeWidth=0.7))
        y0 -= lh

def phone_wireframe(caption, blocks, W=206, H=420):
    d = Drawing(W + 26, H + 34)
    d.add(Rect(12, 16, W, H, rx=16, strokeColor=GRAY, fillColor=WHITE, strokeWidth=1.3))
    d.add(Rect(18, 22, W - 12, H - 12, fillColor=WHITE, strokeColor=None))
    d.add(Rect(W / 2 - 13, H + 16 - 6, 26, 4.5, fillColor=GRAY))
    d.add(String(W / 2 + 13, H + 22, caption, fontName='DejaVu-Bold', fontSize=8.2,
                 fillColor=NAVY, textAnchor='middle'))
    y = 22 + (H - 12) - 6
    for label, kind, bh, wf in blocks:
        bw = (W - 16) * wf
        bx = 18 + ((W - 16) - bw) / 2 if wf < 1 else 18
        _block(d, bx, y - bh, bw, bh, label, kind)
        y -= bh + 5
    return d

def B(label, kind, h, wf=1.0):
    return (label, kind, h, wf)

# ---------------------------------------------------------------- wireframe data
WF = []

WF.append(('W1 · Home — mobile', [
    B('Cudjoe Digital Studio                ☰', 'header', 17),
    B('AI prompts & ebooks for African professionals\nGet 5 free prompts', 'hero', 28),
    B('Get my free prompts', 'btn', 11),
    B('Featured products', 'section', 9),
    B('Freelance Client Machine · 40 prompts\nGH₵ 145 · Word + PDF', 'card', 21),
    B('Human-Sounding AI Copy · 36 pp ebook\nGH₵ 185 · PDF / EPUB', 'card', 21),
    B('Complete Marketing AI Toolkit · 3 items\nGH₵ 319 · save 27%', 'card', 21),
    B('Shop by category', 'section', 9),
    B('FREELANCE      MARKETING', 'chips', 11),
    B('SMALL BUSINESS      CREATORS', 'chips', 11),
    B('DEV / ANALYST', 'chips', 11),
    B('PDF+EPUB · Instant delivery · 14-day refund', 'footer', 12),
    B('Home   Shop   Cart   Account', 'chips', 11),
]))

WF.append(('W2 · Shop — type tabs + filters', [
    B('Shop                        🔍', 'header', 17),
    B('Search prompts, ebooks, bundles…', 'input', 11),
    B('ALL     PROMPTS     EBOOKS     BUNDLES', 'chips', 12),
    B('Category ▾    Sort: Popular ▾', 'chips', 10),
    B('Prompts', 'section', 8),
    B('PKG-FRE-01 · Outreach & Proposals · 15\nGH₵ 75 · Word+PDF', 'card', 20),
    B('PKG-MKT-03 · Copy & Content System · 45\nGH₵ 165 · Word+PDF', 'card', 20),
    B('Ebooks', 'section', 8),
    B('EBK-MKT-01 · Human-Sounding AI Copy\nGH₵ 185 · 36 pp · PDF/EPUB', 'card', 20),
    B('Bundles', 'section', 8),
    B('BND-FRE-01 · Freelance Growth Bundle\nGH₵ 289 · was GH₵ 395', 'card', 20),
    B('Home   Shop   Cart   Account', 'chips', 11),
]))

WF.append(('W3 · Prompt pack product page', [
    B('←  Prompt Pack', 'header', 17),
    B('Freelance Client Machine:\nOutreach & Proposals', 'hero', 24),
    B('15 prompts · Word + PDF · GH₵ 75\nCategory: Freelancers', 'txt', 12),
    B('What’s inside', 'section', 8),
    B('1. Cold outreach that gets replies\n2. Proposal that sells the outcome\n3. Discovery-call opener +3…', 'list', 24),
    B('Sample prompt — free preview', 'section', 8),
    B('“Write a cold email to [CLIENT]…\nunder 120 words, no ‘hope this finds you well’…”', 'card', 20),
    B('You get', 'section', 8),
    B('PDF + Word files · [bracketed] fill-ins\nExample outputs for every prompt', 'list', 15),
    B('Add to cart — GH₵ 75', 'btn', 12),
    B('14-day refund · Free updates for 12 months', 'footer', 11),
]))

WF.append(('W4 · Ebook product page — format toggle', [
    B('←  Ebook', 'header', 17),
    B('[cover 600×900]  Human-Sounding AI Copy\nby Obed Cudjoe · 36 pages · 5 chapters', 'hero', 26),
    B('Synopsis', 'section', 8),
    B('Make AI copy sound human — voice briefs,\nde-AI editing, prompt patterns for ads\nand emails.', 'txt', 17),
    B('Table of contents — tap to preview', 'section', 8),
    B('1. The AI Tell\n2. The Voice Brief\n3. The De-AI Editing Pass', 'list', 18),
    B('About the author', 'section', 8),
    B('Obed Cudjoe — copywriter & AI educator.\n10 yrs writing for brands across Africa.', 'card', 15),
    B('Choose format', 'section', 8),
    B('[  PDF  ]   [  EPUB ✓ ]', 'chips', 12),
    B('Add to cart — GH₵ 185 (EPUB)', 'btn', 12),
    B('Free Chapter 1 ↓', 'footer', 10),
]))

WF.append(('W5 · Bundle product page — itemized + savings', [
    B('←  Bundle', 'header', 17),
    B('Complete Marketing AI Toolkit', 'hero', 18),
    B('Was GH₵ 435      Now GH₵ 319', 'price', 14),
    B('You save GH₵ 116 (27%) — includes:', 'txt', 10),
    B('① Copy & Content System · 45 prompts\nWord+PDF · GH₵ 165', 'card', 20),
    B('② Content, Social & SEO · 15 prompts\nWord+PDF · GH₵ 85', 'card', 20),
    B('③ Human-Sounding AI Copy · 36 pp\nPDF+EPUB · GH₵ 185', 'card', 20),
    B('Delivery', 'section', 8),
    B('1 ZIP file with all files · ~40 MB\nAlso available in your dashboard', 'list', 15),
    B('Add to cart — GH₵ 319', 'btn', 12),
    B('Instant download after payment', 'footer', 10),
]))

WF.append(('W6 · Lead magnet (free sample)', [
    B('Free Prompts', 'header', 17),
    B('5 Free Freelance Prompts\nThat Actually Work', 'hero', 24),
    B('Email address', 'input', 11),
    B('Phone (optional)', 'input', 11),
    B('Send my free prompts', 'btn', 12),
    B('Instant delivery · No spam', 'txt', 9),
    B('What you’ll get', 'section', 8),
    B('1. Cold outreach prompt\n2. Proposal prompt\n3. Scope-creep reply\n4. Invoice chase · 5. Testimonial ask', 'list', 24),
    B('A sample of our paid packs', 'footer', 10),
]))

WF.append(('W7 · Cart', [
    B('Cart (2 items)', 'header', 17),
    B('Outreach & Proposals — GH₵ 75\nFormat: Word + PDF ▾   ✕', 'card', 20),
    B('Human-Sounding AI Copy — GH₵ 185\nFormat: EPUB ▾  (change)   ✕', 'card', 20),
    B('Bundle suggestion', 'section', 8),
    B('Add Creator pack → save 27% on bundle', 'chips', 12),
    B('Subtotal — GH₵ 260\nDelivery: instant · free', 'list', 16),
    B('Checkout — GH₵ 260', 'btn', 12),
    B('14-day refund on every purchase', 'footer', 10),
    B('Home   Shop   Cart   Account', 'chips', 11),
]))

WF.append(('W8 · Checkout — Step 1 (contact + formats + payment)', [
    B('Checkout · Step 1 of 2', 'header', 17),
    B('Contact', 'section', 8),
    B('Email address', 'input', 11),
    B('Phone number (for payment)', 'input', 11),
    B('Confirm formats', 'section', 8),
    B('Outreach & Proposals: [Word+PDF ✓]', 'card', 13),
    B('Human-Sounding AI Copy: [PDF] [EPUB]', 'card', 13),
    B('Payment method', 'section', 8),
    B('● MTN Mobile Money (MoMo)\n○ Telecel Cash\n○ Cards — coming soon', 'list', 18),
    B('Continue — Step 2', 'btn', 12),
]))

WF.append(('W9 · Checkout — Step 2 (pay via phone)', [
    B('Checkout · Step 2 of 2', 'header', 17),
    B('Pay GH₵ 260 to Cudjoe Digital Studio\nvia MTN MoMo · 024 ••• ••••', 'card', 20),
    B('Payment prompt sent to your phone\nApprove with your MoMo PIN', 'hero', 20),
    B('✓ Amount: GH₵ 260\n✓ Merchant: Cudjoe Digital Studio\n○ Waiting for confirmation…', 'list', 19),
    B('I’ve approved — check status', 'btn', 12),
    B('Downloads unlock automatically — no refresh needed', 'footer', 11),
]))

WF.append(('W10 · Payment confirmation + instant download', [
    B('Payment confirmed ✓', 'header', 17),
    B('GH₵ 260 paid — thank you!', 'hero', 18),
    B('Your downloads (links valid 30 min)', 'section', 8),
    B('↓ Outreach & Proposals — Word+PDF', 'card', 16),
    B('↓ Human-Sounding AI Copy — EPUB', 'card', 16),
    B('Links also sent by SMS + email. Re-download\nanytime from your dashboard.', 'txt', 12),
    B('Go to my dashboard', 'btn', 11),
    B('Order #CDS-1024 · 2 items · Receipt ↓', 'footer', 10),
]))

WF.append(('W11 · Login', [
    B('Log in', 'header', 17),
    B('Email or phone number', 'input', 12),
    B('Password', 'input', 12),
    B('Log in', 'btn', 12),
    B('Forgot password?\nNew here? Create account', 'txt', 14),
    B('OTP login via SMS also supported', 'footer', 10),
]))

WF.append(('W12 · Signup', [
    B('Create account', 'header', 17),
    B('Full name', 'input', 12),
    B('Email address', 'input', 12),
    B('Phone number', 'input', 12),
    B('Password', 'input', 12),
    B('Create account', 'btn', 12),
    B('We’ll send a one-time code to verify you', 'footer', 11),
]))

WF.append(('W13 · Account dashboard', [
    B('My Account · Kofi A.', 'header', 17),
    B('Quick actions', 'section', 8),
    B('↓ My downloads (4 items)\n🛒 Purchase history\n⚙ Settings', 'list', 20),
    B('Recent purchases', 'section', 8),
    B('Freelance Business Engine — paid ✓', 'card', 15),
    B('Human-Sounding AI Copy — paid ✓', 'card', 15),
    B('Notifications', 'section', 8),
    B('✓ Email receipts: on\n✓ SMS delivery: on', 'list', 14),
    B('Log out', 'btn', 11),
]))

WF.append(('W14 · Downloads — re-download & format switch', [
    B('My Downloads', 'header', 17),
    B('Freelance Business Engine — prompt pack\n[ Word+PDF ↓ ]  [ new link ]', 'card', 19),
    B('Human-Sounding AI Copy — ebook\nBought: PDF   Now get: [ EPUB ↓ ]  [ PDF ↓ ]', 'card', 20),
    B('Marketing AI Toolkit — bundle\n[ ↓ ZIP · 40 MB ]', 'card', 17),
    B('Links expire after 30 minutes — fresh links\nare generated here anytime, free.', 'txt', 13),
]))

WF.append(('W15 · Purchase history', [
    B('Purchase History', 'header', 17),
    B('Order #CDS-1024 · 20 Aug 2026 · GH₵ 260\n2 items · paid · Receipt ↓', 'card', 18),
    B('Order #CDS-1018 · 12 Aug 2026 · GH₵ 145\n1 item · paid · Receipt ↓', 'card', 18),
    B('Order #CDS-1002 · 30 Jul 2026 · GH₵ 319\n3 items · paid · Receipt ↓', 'card', 18),
    B('Order #CDS-0987 · 21 Jul 2026 · GH₵ 75\n1 item · refunded · Refund note ↓', 'card', 18),
    B('Need an invoice? Download any receipt above', 'footer', 10),
]))

WF.append(('W16 · Admin dashboard — sales overview', [
    B('Admin · Overview          Logout', 'header', 17),
    B('Sales today: GH₵ 0 · Week: GH₵ 1,240', 'chips', 11),
    B('Orders: 34 · Conv: 2.1% · AOV: GH₵ 74', 'chips', 11),
    B('Revenue by type — last 7 days', 'section', 8),
    B('Prompts ████████ 45%\nEbooks ██████ 30%\nBundles █████ 25%', 'list', 20),
    B('Top products', 'section', 8),
    B('1. Freelance Business Engine — GH₵ 3,190\n2. Marketing AI Toolkit — GH₵ 2,552\n3. Human-Sounding AI Copy — GH₵ 1,850', 'list', 22),
    B('Quick links: Products · Bundles · Orders', 'footer', 10),
]))

WF.append(('W17 · Admin — new prompt pack', [
    B('Admin · New Prompt Pack        Save', 'header', 17),
    B('Title*', 'input', 10),
    B('One-line description*', 'input', 10),
    B('Prompt count*', 'input', 10),
    B('Category ▾   ·   Price GH₵*', 'input', 10),
    B('Files: Word + PDF (upload)*', 'input', 10),
    B('✓ 3 preview prompts added\n✓ Tested on ChatGPT / Claude / Gemini\n✓ README with known limitations', 'list', 18),
    B('Save pack', 'btn', 12),
    B('Publishing = visible in shop immediately', 'footer', 10),
]))

WF.append(('W18 · Admin — new ebook (cover + TOC)', [
    B('Admin · New Ebook               Save', 'header', 17),
    B('Drop cover image here (600×900)', 'input', 18),
    B('Title*', 'input', 10),
    B('Synopsis*', 'input', 10),
    B('Table of contents — paste chapters*', 'input', 14),
    B('Author · Page count · Price GH₵*', 'input', 10),
    B('Files: PDF + EPUB (upload)*', 'input', 10),
    B('Save ebook', 'btn', 12),
]))

WF.append(('W19 · Admin — bundle builder', [
    B('Admin · Build Bundle', 'header', 17),
    B('1 · Pick products', 'section', 8),
    B('✓ Copy & Content System — GH₵ 165\n✓ Content, Social & SEO — GH₵ 85\n✓ Human-Sounding AI Copy — GH₵ 185\n○ Freelance Business Engine — GH₵ 145', 'list', 26),
    B('2 · Pricing (auto-computed)', 'section', 8),
    B('Combined value: GH₵ 435\nBundle price: GH₵ 319 → save 27%', 'card', 18),
    B('3 · ZIP (auto-assembled)', 'section', 8),
    B('3 files · Word+PDF (packs) + PDF+EPUB\nEstimated ZIP ~40 MB', 'list', 15),
    B('Create bundle', 'btn', 12),
]))

WF.append(('W20 · Admin — orders', [
    B('Admin · Orders', 'header', 17),
    B('Search by email / phone / order #', 'input', 11),
    B('CDS-1024 · Kofi A. · GH₵ 260 · paid\n[ resend links ] [ mark refunded ]', 'card', 18),
    B('CDS-1023 · Ama B. · GH₵ 75 · paid\n[ resend links ]', 'card', 15),
    B('CDS-1022 · Yaw C. · GH₵ 319 · pending\n[ view gateway status ]', 'card', 15),
    B('CDS-1021 · Esi M. · GH₵ 185 · failed\n[ contact buyer ]', 'card', 15),
]))

WF.append(('W21 · Static page template — FAQ / About / Contact / Terms', [
    B('FAQ', 'header', 17),
    B('Search questions…', 'input', 11),
    B('? How do I get my files after paying?\n? What if my download link expires?\n? Can I get a refund?\n? Which devices read EPUB?', 'list', 28),
    B('Still stuck?', 'section', 8),
    B('WhatsApp +233 XX XXX XXXX\nhello@cudjoe.digital · Mon–Sat 9–18', 'card', 16),
    B('Same layout reused for About, Contact,\nTerms, Privacy, Refund & Delivery pages', 'footer', 12),
]))

# ---------------------------------------------------------------- desktop wireframes (secondary)
DESK = []
DESK.append(('D1 · Home — desktop', [
    B('Logo          Shop   About   FAQ   Contact        Cart', 'header', 16),
    B('Hero: AI prompts & ebooks for African professionals', 'hero', 26),
    B('Left: lead-magnet capture form', 'input', 14),
    B('3-column featured products', 'section', 8),
    B('Product card A', 'card', 22), B('Product card B', 'card', 22), B('Product card C', 'card', 22),
    B('Trust bar + footer', 'footer', 14),
]))
DESK.append(('D2 · Shop — desktop', [
    B('Shop            🔍', 'header', 16),
    B('Sidebar: categories', 'list', 18),
    B('Type tabs: ALL PROMPTS EBOOKS BUNDLES', 'chips', 10),
    B('Product grid row 1 (4 cards)', 'section', 8),
    B('card', 'card', 18), B('card', 'card', 18), B('card', 'card', 18), B('card', 'card', 18),
    B('Product grid row 2', 'section', 8),
    B('card', 'card', 18), B('card', 'card', 18), B('card', 'card', 18), B('card', 'card', 18),
]))
DESK.append(('D3 · Admin — desktop', [
    B('Sidebar: Overview · Products · Bundles ·\nOrders · Customers · Settings', 'list', 26),
    B('KPI stat cards', 'section', 8),
    B('GH₵ 1,240', 'card', 16), B('34 orders', 'card', 16), B('2.1% conv', 'card', 16),
    B('Revenue chart area', 'hero', 24),
    B('Recent orders table', 'list', 22),
]))

# ---------------------------------------------------------------- payment sequence diagram
def pay_flow_drawing():
    W, H = 500, 470
    d = Drawing(W, H)
    cols = [('Buyer', 55), ('Store', 185), ('Gateway', 315), ('Buyer’s phone', 445)]
    for name, x in cols:
        d.add(String(x, H - 12, name, fontName='DejaVu-Bold', fontSize=8.6, fillColor=NAVY, textAnchor='middle'))
        d.add(Line(x, H - 20, x, 34, strokeColor=colors.HexColor('#9aa3b2'), strokeWidth=0.9))
    def arrow(x1, x2, y, label, selfloop=False):
        d.add(Line(x1, y, x2, y, strokeColor=colors.HexColor('#333'), strokeWidth=1.1))
        if x2 > x1:
            d.add(Polygon([x2, y, x2 - 6, y - 3, x2 - 6, y + 3], fillColor=colors.HexColor('#333'), strokeColor=None))
        else:
            d.add(Polygon([x2, y, x2 + 6, y - 3, x2 + 6, y + 3], fillColor=colors.HexColor('#333'), strokeColor=None))
        d.add(String((x1 + x2) / 2, y + 4, label, fontName='DejaVu', fontSize=7,
                     fillColor=colors.HexColor('#333'), textAnchor='middle'))
    arrow(55, 185, 408, '1 · Phone + confirm  →  POST /checkout/pay')
    arrow(185, 315, 358, '2 · Initiate payment (phone, amount)')
    arrow(315, 445, 308, '3 · USSD / app push prompt')
    arrow(445, 315, 258, '4 · Buyer approves with PIN')
    arrow(315, 185, 208, '5 · Webhook: payment.confirmed (signed)')
    arrow(185, 185, 158, '6 · Verify signature · mark paid · fulfill', selfloop=True)
    arrow(185, 55, 108, '7 · SMS + email with signed links')
    arrow(55, 185, 58, '8 · GET /download/{token} → file (TTL 30 min)')
    return d

def checkout_flow_drawing():
    W, H = 500, 150
    d = Drawing(W, H)
    boxes = [('Product page', 'add to cart'),
             ('Cart', 'formats + savings'),
             ('Step 1', 'contact · format · method'),
             ('Step 2', 'pay on phone · poll'),
             ('Confirmed', 'downloads unlock')]
    bw, bh, gap = 92, 34, 4
    x = 6
    for i, (t, s) in enumerate(boxes):
        d.add(Rect(x, 70, bw, bh, fillColor=colors.HexColor('#efefef'), strokeColor=colors.HexColor('#b5b5b5'), strokeWidth=0.9))
        d.add(String(x + bw / 2, 88, t, fontName='DejaVu-Bold', fontSize=7.4, fillColor=NAVY, textAnchor='middle'))
        d.add(String(x + bw / 2, 77, s, fontName='DejaVu', fontSize=5.8, fillColor=colors.HexColor('#555'), textAnchor='middle'))
        if i < len(boxes) - 1:
            d.add(Line(x + bw + 2, 87, x + bw + gap - 2, 87, strokeColor=colors.HexColor('#333'), strokeWidth=1))
            d.add(Polygon([x + bw + gap - 2, 87, x + bw + gap - 8, 84, x + bw + gap - 8, 90], fillColor=colors.HexColor('#333'), strokeColor=None))
        x += bw + gap
    d.add(String(W / 2, 34, 'Format selection happens in Cart (per item) and is confirmed in Step 1 — ebooks: PDF or EPUB · bundles: single ZIP · prompts: Word+PDF',
                 fontName='DejaVu', fontSize=7, fillColor=colors.HexColor('#444'), textAnchor='middle'))
    return d

# ---------------------------------------------------------------- component inventory drawings
def components_drawing():
    W, H = 500, 330
    d = Drawing(W, H)
    cx = [10, 175, 340]
    cy = [H - 20, H - 165]
    def cell(x, y, title, drawfn):
        d.add(Rect(x, y - 130, 150, 140, fillColor=WHITE, strokeColor=colors.HexColor('#c9c9c9'), strokeWidth=0.8))
        d.add(String(x + 75, y - 8, title, fontName='DejaVu-Bold', fontSize=7, fillColor=NAVY, textAnchor='middle'))
        drawfn(x + 8, y - 20, 134)
    def nav_top(x, y, w):
        _block(d, x, y, w, 12, 'Logo            ☰', 'header')
        _block(d, x, y - 16, w, 10, 'Home   Shop   Cart   Account', 'chips')
    def card_prompt(x, y, w):
        _block(d, x, y, w, 30, 'PROMPT PACK · 15\nOutreach & Proposals\nGH₵ 75 · Word+PDF', 'card')
    def card_ebook(x, y, w):
        _block(d, x, y, w, 30, '[cover] Human-Sounding AI Copy\n36 pp · PDF/EPUB · GH₵ 185', 'card')
    def card_bundle(x, y, w):
        _block(d, x, y, w, 30, 'BUNDLE · 3 items · save 27%\nWas GH₵ 435 · Now GH₵ 319', 'card')
    def fmt_sel(x, y, w):
        _block(d, x, y, w, 11, 'PDF', 'chips')
        _block(d, x + w / 2, y, w / 2, 11, 'EPUB ✓', 'btn')
        d.add(Line(x, y - 2, x + w, y - 2, strokeColor=colors.HexColor('#999'), strokeWidth=0.6))
    def dl_btn(x, y, w):
        _block(d, x, y, w, 11, '↓ Download (30 min)', 'btn')
        _block(d, x, y - 14, w, 9, 'expired → get new link', 'input')
        _block(d, x, y - 26, w, 9, 'resume ↻', 'chips')
    def admin_panel(x, y, w):
        _block(d, x, y, w * 0.3, 34, 'Overview\nProducts\nOrders', 'list')
        _block(d, x + w * 0.34, y, w * 0.3, 14, 'GH₵ 1,240', 'card')
        _block(d, x + w * 0.68, y, w * 0.3, 14, '34 orders', 'card')
        _block(d, x + w * 0.34, y - 18, w * 0.64, 14, 'chart area', 'hero')
    cell(cx[0], cy[0], 'Navbar (mobile)', lambda x, y, w: nav_top(x, y, w))
    cell(cx[1], cy[0], 'Product card — prompt', lambda x, y, w: card_prompt(x, y, w))
    cell(cx[2], cy[0], 'Product card — ebook', lambda x, y, w: card_ebook(x, y, w))
    cell(cx[0], cy[1], 'Product card — bundle', lambda x, y, w: card_bundle(x, y, w))
    cell(cx[1], cy[1], 'Format selector', lambda x, y, w: fmt_sel(x, y, w))
    cell(cx[2], cy[1], 'Download button states', lambda x, y, w: dl_btn(x, y, w))
    cell(cx[0] + 0, cy[1] - 130 - 12, 'Admin panel', lambda x, y, w: admin_panel(x, y, w))
    return d

# ---------------------------------------------------------------- content data
def journey_rows():
    return [
        ['#', 'Buyer action', 'System response', 'Page / route'],
        ['1', 'Lands on the site from an ad / WhatsApp link, sees the hero offer.',
         'Hero renders; lead-magnet capture visible.', '/'],
        ['2', 'Taps “Shop prompts”.',
         'Shop loads with type tabs and category filter.', '/shop?type=prompts'],
        ['3', 'Taps the “Prompts” tab, filters “Freelancers”, opens “Outreach & Proposals”.',
         'Product page shows count, formats (Word+PDF), GH₵ 75, and a 3-prompt sample preview.', '/products/prompt-pack/pkg-fre-01'],
        ['4', 'Reads “What’s inside”, previews sample prompts, taps “Add to cart”.',
         'Cart badge updates; item stored with type + format.', '/cart'],
        ['5', 'Taps “Checkout”, enters email + phone, confirms Word+PDF, selects MTN MoMo.',
         'Order created (pending); step 2 shows amount and payment prompt status.', '/checkout (step 1)'],
        ['6', 'Approves the MoMo prompt on their phone with PIN.',
         'Webhook received → signature verified → order marked paid → files fulfilled.', '/checkout (step 2)'],
        ['7', 'Sees the confirmation screen with download buttons; also gets SMS + email.',
         'Signed links (30-min TTL) generated; email + SMS sent.', '/checkout/confirmation/1024'],
        ['8', 'Taps “↓ Download Word+PDF”, file saves on the phone.',
         'Signed URL streamed; range-request supported.', '/downloads/{token}'],
        ['9', 'Optional: creates an account to keep re-download access.',
         'Purchase linked to the account; appears in dashboard.', '/auth/signup'],
    ]

def journey_ebook_rows():
    return [
        ['#', 'Buyer action', 'System response', 'Page / route'],
        ['1', 'Opens Shop, taps the “Ebooks” tab, sees “Human-Sounding AI Copy”.',
         'Ebook card shows cover, page count, PDF/EPUB chips, GH₵ 185.', '/shop?type=ebooks'],
        ['2', 'Opens the ebook product page.',
         'Layout: cover, synopsis, TOC preview accordion, author section, page count, format toggle.', '/products/ebook/ebk-mkt-01'],
        ['3', 'Reads Chapter 1 (free preview), flips the format toggle to EPUB (reads on phone).',
         'Selection stored on the cart item.', '—'],
        ['4', 'Adds to cart; cart line shows “EPUB” with a change link.',
         'Format locked at checkout step 1 for confirmation.', '/cart'],
        ['5', 'Checkout: email + phone, confirms EPUB, picks Telecel Cash.',
         'Order pending; Telecel USSD prompt initiated.', '/checkout (step 1)'],
        ['6', 'Approves payment on the phone.',
         'Webhook verified → paid → EPUB link generated (other formats stay available in dashboard).', '/checkout (step 2)'],
        ['7', 'Downloads EPUB from confirmation page.',
         'Signed link delivered; also via SMS + email.', '/checkout/confirmation/1025'],
        ['8', 'Later opens the ebook and it renders in the reader app.',
         'EPUB is reflowable; dashboard notes “PDF also available”.', '/account/downloads'],
    ]

def journey_bundle_rows():
    return [
        ['#', 'Buyer action', 'System response', 'Page / route'],
        ['1', 'Sees “Complete Marketing AI Toolkit — save 27%” on the home page.',
         'Featured bundle renders with savings badge.', '/'],
        ['2', 'Opens the bundle product page.',
         'Itemized list with thumbnails + descriptions; combined GH₵ 435 struck through, GH₵ 319 highlighted.', '/products/bundle/bnd-mkt-01'],
        ['3', 'Reads included items, taps “Add to cart”.',
         'Cart shows bundle as one line with savings summary.', '/cart'],
        ['4', 'Checks out via MTN MoMo (single payment of GH₵ 319).',
         'One order, one payment, one fulfillment job.', '/checkout'],
        ['5', 'Approves payment; confirmation page appears.',
         'Pre-built ZIP (~40 MB) link unlocked; SMS + email sent.', '/checkout/confirmation/1026'],
        ['6', 'Downloads the ZIP; extracts on device.',
         'Contents: 2 packs (Word+PDF) + 1 ebook (PDF+EPUB) + README + license.', '/downloads/{token}'],
        ['7', 'Finds the ZIP is also in the dashboard for later.',
         'Re-download available anytime with fresh links.', '/account/downloads'],
    ]

def journey_return_rows():
    return [
        ['#', 'Buyer action', 'System response', 'Page / route'],
        ['1', 'Returns to the site two weeks later; taps “Log in”.',
         'Login page with email/password or OTP.', '/auth/login'],
        ['2', 'Verifies identity (password or SMS OTP).',
         'Session created; redirected to dashboard.', '/account'],
        ['3', 'Opens “My downloads”.',
         'Lists all purchases with format options.', '/account/downloads'],
        ['4', 'Finds “Human-Sounding AI Copy” (bought as PDF), taps “EPUB ↓”.',
         'New signed link generated (30-min TTL); download starts.', '/account/downloads'],
        ['5', 'Also refreshes the expired bundle ZIP link.',
         'Fresh URL issued; old token revoked.', '/account/downloads'],
        ['6', 'Downloads both files to a new device.',
         'No re-purchase needed — files tied to the account.', '/account/downloads'],
    ]

def admin_rows():
    return [
        ['#', 'Admin action', 'System response', 'Screen'],
        ['1', 'Admin → Products → “New prompt pack”.',
         'Empty form loads with all pack fields.', '/admin/products/prompts/new'],
        ['2', 'Fills title, description, count, category, GH₵ price; uploads Word + PDF; adds 3 preview prompts; ticks the “tested on 3 models” checklist.',
         'Files validated (format, size, virus scan); previews rendered.', 'form'],
        ['3', 'Saves → pack live in the shop.',
         'SKU PKG-… assigned; card appears under Prompts tab.', '/shop?type=prompts'],
        ['4', 'Admin → Products → “New ebook”.',
         'Ebook form: cover dropzone, title, synopsis, TOC, author, page count, price, PDF+EPUB upload.', '/admin/products/ebooks/new'],
        ['5', 'Uploads cover (600×900), pastes TOC, uploads PDF + EPUB, sets sample chapter.',
         'Cover processed; TOC hyperlinked in EPUB; sample chapter served on product page.', 'form'],
        ['6', 'Saves → ebook live.',
         'SKU EBK-… assigned; format toggle functional.', '/shop?type=ebooks'],
        ['7', 'Admin → Bundles → “Build bundle”.',
         'Product picker loads all packs + ebooks with prices.', '/admin/bundles/new'],
        ['8', 'Selects 3 products → combined value auto-computed (GH₵ 435) → enters GH₵ 319 → ZIP auto-assembled → publishes.',
         'Savings badge (27%) computed; ZIP built once and stored; bundle live.', '/admin/bundles'],
    ]

def error_rows():
    return [
        ['Error', 'When it happens', 'What the buyer sees', 'System behavior', 'Recovery'],
        ['Payment failed / declined', 'Gateway rejects the charge request.',
         '“Payment failed. Please try again or choose another method.” with retry + method switch.',
         'Order stays “pending”; no files sent.', 'Retry button; switch MoMo ↔ Telecel; support contact.'],
        ['Insufficient balance', 'MoMo/Telecel balance below the amount.',
         '“Insufficient balance on your line. Top up and try again.”',
         'Gateway returns insufficient-funds code; order untouched.', 'Auto-refresh after top-up; cancel order option.'],
        ['Network timeout', 'Buyer approves, but the confirmation webhook never arrives (drop-off).',
         '“We’re still checking your payment…” with a check-status button.',
         'Status polling + reconciliation job; if paid, order auto-fulfills on webhook.', 'Buyer taps “I’ve approved” → status refresh; downloads unlock automatically.'],
        ['Invalid phone number', 'Wrong prefix or malformed number at step 1.',
         'Inline error: “Enter a valid MTN (024/054/055/059) or Telecel (020/027/050) number.”',
         'Client + server validation before initiating payment.', 'Correct number; prefix guidance shown.'],
        ['Expired download link', 'Link older than the 30-minute TTL.',
         '“This download link has expired. Get a fresh one from your dashboard.”',
         'Token rejected by signature/TTL check.', 'Dashboard generates new links anytime; login prompt for guests.'],
        ['Download interrupted', 'Mobile data drops mid-download (large ZIP).',
         '“Download paused” with resume button.',
         'Range requests supported; partial file retained.', '“Resume” continues from byte offset; retry generates new token.'],
        ['Unsupported format', 'Buyer tries to open EPUB on a device without a reader.',
         '“This format isn’t supported here. Use the Kindle/Books app, or download the PDF instead.”',
         'Format matrix shown on product page and dashboard.', 'Format switch in dashboard; PDF fallback always available.'],
        ['Webhook timeout / paid but unfulfilled', 'Gateway confirms but fulfillment job stalls.',
         '“We’re preparing your files…” (auto-refresh).',
         'Reconciliation job marks order paid and retries fulfillment.', 'Files appear automatically; support can resend links.'],
        ['Duplicate payment', 'Buyer pays twice (double prompt).',
         'Confirmation shows one order; second charge flagged.',
         'Idempotency keys dedupe orders; duplicate auto-refunded.', 'Refund receipt emailed; support ticket if >48 h.'],
        ['SMS / email not received', 'Delivery notification lost in spam or wrong number.',
         'Confirmation page still shows downloads; “Resend links” available.',
         'Logs delivery attempt; resend endpoint.', 'Resend from confirmation page or dashboard.'],
    ]

def comp_rows():
    return [
        ['Component', 'Variants / states', 'Notes'],
        ['Navbar', 'Top bar (logo, menu, search) · bottom nav (Home, Shop, Cart, Account)',
         'Sticky bottom nav on mobile; desktop switches to top nav only.'],
        ['Product card — prompt', 'Default · sale · out-of-stock (n/a at launch)',
         'Badge “PROMPT PACK · N prompts”, price, Word+PDF chips.'],
        ['Product card — ebook', 'Default · featured',
         'Cover thumb, page count, PDF/EPUB chips, “Free chapter” tag.'],
        ['Product card — bundle', 'Default · featured',
         '“BUNDLE · 3 items · save 27%”, strikethrough value + bundle price.'],
        ['Type tabs', 'All / Prompts / Ebooks / Bundles (active state)',
         'Query param ?type=; category filter combines with tabs.'],
        ['Format selector', 'PDF / EPUB segmented control (ebook) · Word+PDF fixed (prompt) · ZIP fixed (bundle)',
         'Selection set in cart, confirmed in checkout step 1, changeable in dashboard.'],
        ['Download button', 'Ready (↓, 30-min TTL) · expired (get new link) · resume (↻ partial)',
         'Signed URLs; big tap target; progress shown for large files.'],
        ['Checkout form', 'Step 1: contact + format confirm + payment method; Step 2: pay + poll',
         '2 steps max; validation inline; back button preserves state.'],
        ['Payment method cards', 'MTN MoMo · Telecel Cash (radio) · Cards “coming soon” (disabled)',
         'Shows network logos and “you’ll approve on your phone” note.'],
        ['Order/status chip', 'pending · paid · fulfilled · failed · refunded',
         'Colour-coded; shown in admin, confirmation, dashboard.'],
        ['Admin panel', 'Sidebar + KPI cards + tables (products, bundles, orders)',
         'Desktop-first admin; mobile falls back to stacked cards.'],
        ['Empty/error states', 'Empty cart · empty downloads · failed payment · expired link',
         'Every state has a CTA (browse shop, retry, get new link).'],
    ]

# ---------------------------------------------------------------- document assembly
def main():
    meta = dict(
        header_left='Digital Marketplace Launch Plan',
        header_right='Cudjoe Digital Studio',
        footer_left='Step 4 — User Flows & Wireframes',
        title='User Flows & Wireframes',
        author='Obed Cudjoe',
        subject='Buyer journeys, MoMo/Telecel checkout flow, error states and mobile-first wireframes',
    )

    class Doc(BaseDocTemplate):
        def __init__(self, fn, meta):
            super().__init__(fn, pagesize=A4, leftMargin=M_L, rightMargin=M_R,
                             topMargin=M_T, bottomMargin=M_B, title=meta['title'], author=meta['author'])
            self.meta = meta
            cf = Frame(M_L, M_B, USABLE_W, PAGE_H - M_T - M_B, id='cover')
            bf = Frame(M_L, M_B, USABLE_W, PAGE_H - M_T - M_B - 0.4*cm, id='body')
            self.addPageTemplates([
                PageTemplate(id='Cover', frames=[cf], onPage=self._cover_bg),
                PageTemplate(id='Body', frames=[bf]),
            ])
        def _cover_bg(self, canv, doc):
            canv.saveState()
            canv.setFillColor(NAVY); canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
            canv.setFillColor(TEAL); canv.rect(0, PAGE_H - 0.32*cm, PAGE_W, 0.32*cm, stroke=0, fill=1)
            canv.setFillColor(colors.HexColor('#1C3D8F'))
            canv.circle(PAGE_W - 1.2*cm, 1.2*cm, 3.2*cm, stroke=0, fill=1)
            canv.restoreState()

    def cover():
        els = [Spacer(1, 3.0*cm)]
        els.append(Paragraph('User Flows & Wireframes · Step 4 of 5', S['cover-step']))
        els.append(Spacer(1, 0.45*cm))
        els.append(Paragraph('User Flows & Wireframes', S['cover-title']))
        els.append(Spacer(1, 0.55*cm))
        bar = Table([['']], colWidths=[2.4*cm], rowHeights=[0.14*cm])
        bar.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), TEAL)]))
        els.append(bar)
        els.append(Spacer(1, 0.55*cm))
        els.append(Paragraph('The complete buyer journey from landing page to first download — including the mobile money and Telecel Cash payment flow, format selection, every error state, and low-fidelity wireframes for every MVP page, mobile-first.',
                             S['cover-sub']))
        els.append(Spacer(1, 1.7*cm))
        chips = [[Paragraph(c, S['chip'])] for c in ['Date: August 25, 2026',
                 'MVP scope: 17 route groups', '21 mobile + 3 desktop wireframes',
                 'MTN MoMo + Telecel Cash · signed links']]
        ct = Table(chips, colWidths=[9.0*cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2A3D66')),
            ('BOX', (0,0), (-1,-1), 0.6, colors.HexColor('#FFFFFF40')),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 12)]))
        els.append(ct)
        els.append(Spacer(1, 2.4*cm))
        els.append(Paragraph('Step 4 of 5 · User Flows & Wireframes', S['cover-foot']))
        els.append(NextPageTemplate('Body'))
        els.append(PageBreak())
        return els

    def h2(num, title, sub=None):
        flow = [Paragraph(f'<font color="#12B886"><b>{num}</b></font>&nbsp;&nbsp;<b>{title}</b>',
                          st('h2x', fontName='DejaVu-Bold', fontSize=14.5, leading=18, textColor=NAVY))]
        flow.append(Spacer(1, 0.08*cm))
        rule = Table([['']], colWidths=[USABLE_W], rowHeights=[0.05*cm])
        rule.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), NAVY)]))
        flow.append(rule)
        if sub:
            flow += [Spacer(1, 0.2*cm), Paragraph(inline(sub), S['sub'])]
        flow.append(Spacer(1, 0.32*cm))
        return flow

    def h3(t):
        return [Paragraph(f'<b>{inline(t)}</b>', S['h3']), Spacer(1, 0.1*cm)]

    story = cover()
    # contents
    story += h2('', 'Contents', None)
    toc_items = ['1 · Buyer Journey Maps — 4 flows', '2 · Admin Journey Map',
                 '3 · Mobile Money / Telecel Cash Checkout Flow', '4 · Error State Inventory',
                 '5 · Low-Fidelity Wireframes — Mobile (21)', '6 · Desktop Wireframes (secondary)',
                 '7 · Reusable Component Inventory']
    for t in toc_items:
        story.append(Paragraph(f'•  {t}', st('toc', fontSize=10.5, leading=17)))
    story.append(PageBreak())

    # 1 journeys
    story += h2('1', 'Buyer Journey Maps', 'Four numbered journeys covering prompt purchase, ebook purchase with format selection, bundle purchase, and re-download.')
    story += h3('Journey 1 · First-time buyer purchases a prompt pack')
    story.append(table_flowable(journey_rows()))
    story.append(Spacer(1, 0.3*cm))
    story += h3('Journey 2 · First-time buyer purchases an ebook with format selection')
    story.append(table_flowable(journey_ebook_rows()))
    story.append(Spacer(1, 0.3*cm))
    story += h3('Journey 3 · Buyer purchases a bundle and receives multiple files')
    story.append(table_flowable(journey_bundle_rows()))
    story.append(Spacer(1, 0.3*cm))
    story += h3('Journey 4 · Returning buyer logs in and re-downloads in a different format')
    story.append(table_flowable(journey_return_rows()))
    story.append(PageBreak())

    # 2 admin
    story += h2('2', 'Admin Journey Map', 'Uploading a prompt pack, uploading an ebook with cover image and table of contents, and creating a bundle from existing products.')
    story.append(table_flowable(admin_rows()))
    story.append(PageBreak())

    # 3 payment flow
    story += h2('3', 'Mobile Money & Telecel Cash Checkout Flow', 'The exact sequence from product page to instant download, including the on-phone approval and webhook verification.')
    story.append(DFlowable(checkout_flow_drawing()))
    story.append(Spacer(1, 0.5*cm))
    story.append(DFlowable(pay_flow_drawing()))
    story.append(Spacer(1, 0.4*cm))
    note = ('The same diagram applies to Telecel Cash — only the gateway endpoint and phone-number prefixes change '
            '(MTN: 024/054/055/059 · Telecel: 020/026/027/050). Format selection happens in the cart (per item) and is '
            'confirmed in checkout step 1 before payment is initiated. Download links are HMAC-signed with a 30-minute TTL '
            'and unlock only after the webhook marks the order paid.')
    story.append(Paragraph(note, S['body']))
    story.append(PageBreak())

    # 4 errors
    story += h2('4', 'Error State Inventory', 'Payment failures, delivery issues, format compatibility and access problems — what the buyer sees and how the system recovers.')
    story.append(table_flowable(error_rows(), minwidths=[72, 100, 112, 112, 96]))
    story.append(PageBreak())

    # 5 wireframes
    story += h2('5', 'Low-Fidelity Wireframes — Mobile First', 'Every MVP page at 360–430 px width. Blocks show section order and component structure; text labels show real store copy. Product-type layouts are distinct: prompt packs (count + sample), ebooks (cover · synopsis · TOC · author · format toggle), bundles (itemized list + strikethrough savings).')
    pairs = []
    for i in range(0, len(WF), 2):
        row = [DFlowable(phone_wireframe(*WF[i]))]
        if i + 1 < len(WF):
            row.append(DFlowable(phone_wireframe(*WF[i + 1])))
        t = Table([row], colWidths=[252, 252])
        t.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'),
                               ('VALIGN', (0,0), (-1,-1), 'TOP'),
                               ('LEFTPADDING', (0,0), (-1,-1), 2), ('RIGHTPADDING', (0,0), (-1,-1), 2),
                               ('TOPPADDING', (0,0), (-1,-1), 4)]))
        pairs.append(t)
        pairs.append(PageBreak())
    story += pairs[:-1]  # drop the final trailing PageBreak

    # 6 desktop
    story += h2('6', 'Desktop Wireframes (Secondary)', 'The same pages scale to desktop: wider grids, top navigation, sidebar filters. Admin is desktop-first.')
    for d in DESK:
        t = Table([[DFlowable(phone_wireframe(d[0], d[1], W=170, H=215))]], colWidths=[USABLE_W])
        t.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
        story.append(t)
        story.append(Spacer(1, 0.25*cm))
    story.append(PageBreak())

    # 7 components
    story += h2('7', 'Reusable Component Inventory', 'The building blocks used across all pages, with variants and states.')
    story.append(DFlowable(components_drawing()))
    story.append(Spacer(1, 0.4*cm))
    story.append(table_flowable(comp_rows()))

    doc = Doc(OUT, meta)
    doc.multiBuild(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_meta=meta, **k))
    print('Built', OUT)

if __name__ == '__main__':
    main()
