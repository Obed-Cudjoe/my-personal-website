#!/usr/bin/env python3
"""Step 7 — Go-Live Guide PDF generator (deploy + Paystack + CI)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib import colors
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, NextPageTemplate)
from report_pdf_template import (NAVY, TEAL, INK, MUTED, LINE, A4, cm, USABLE_W, PAGE_W, PAGE_H,
                                 M_L, M_R, M_T, M_B, NumberedCanvas, inline, table_flowable, st, S)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'market-research', 'step-7-go-live-guide.pdf')

S['code'] = st('code', fontName='DejaVuMono', fontSize=7.4, leading=10.4, textColor=colors.HexColor('#1e293b'))

def code_block(text, bg=colors.HexColor('#f1f5f9')):
    rows = []
    for ln in text.split('\n'):
        safe = ln.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        rows.append([Paragraph(safe or '&nbsp;', S['code'])])
    t = Table(rows, colWidths=[USABLE_W - 0.9*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('BOX', (0,0), (-1,-1), 0.6, colors.HexColor('#cbd5e1')),
        ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 1.5), ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
    ]))
    return t

def main():
    meta = dict(
        header_left='Digital Marketplace Launch Plan',
        header_right='Cudjoe Digital Studio',
        footer_left='Step 7 — Go-Live Guide',
        title='Go-Live Guide: Deploy, Real Mobile Money & CI',
        author='Obed Cudjoe',
        subject='Step-by-step: Vercel deploy, Paystack Ghana (MTN MoMo + Telecel Cash), CI pipeline',
    )

    class Doc(BaseDocTemplate):
        def __init__(self, fn, meta):
            super().__init__(fn, pagesize=A4, leftMargin=M_L, rightMargin=M_R,
                             topMargin=M_T, bottomMargin=M_B, title=meta['title'], author=meta['author'])
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
        els.append(Paragraph('Go-Live Guide · Step 7 — Deploy, Real Mobile Money & CI', S['cover-step']))
        els.append(Spacer(1, 0.45*cm))
        els.append(Paragraph('Go-Live Guide\nDeploy · Paystack · CI', S['cover-title']))
        els.append(Spacer(1, 0.55*cm))
        bar = Table([['']], colWidths=[2.4*cm], rowHeights=[0.14*cm])
        bar.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), TEAL)]))
        els.append(bar)
        els.append(Spacer(1, 0.55*cm))
        els.append(Paragraph('The three steps that need your accounts: deploy the built marketplace to Vercel, turn on real MTN MoMo and Telecel Cash payments with Paystack (Ghana), and enable the CI pipeline. The code is already written and tested — this guide covers only the account-side setup.',
                             S['cover-sub']))
        els.append(Spacer(1, 1.7*cm))
        chips = [[Paragraph(c, S['chip'])] for c in [
            'Date: August 26, 2026', 'Time: ~1 hour + Paystack verification (1–3 days)',
            'Accounts needed: Vercel · Paystack (Ghana) · GitHub', 'Code status: built & E2E-tested']]
        ct = Table(chips, colWidths=[9.0*cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2A3D66')),
            ('BOX', (0,0), (-1,-1), 0.6, colors.HexColor('#FFFFFF40')),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 12)]))
        els.append(ct)
        els.append(Spacer(1, 2.4*cm))
        els.append(Paragraph('Step 7 of 7 · Go-Live Guide', S['cover-foot']))
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

    def step(n, text):
        return [Paragraph(f'<b>{n}.</b>&nbsp;&nbsp;{inline(text)}', st('st', fontSize=9.4, leading=14, spaceAfter=6, leftIndent=4))]

    story = cover()
    story += h2('', 'Contents', None)
    for t in ['1 · Deploy to Vercel (~15 min)', '2 · Real mobile money via Paystack (~1 h + verification)',
              '3 · Enable the CI workflow (~5 min)', '4 · Production data: Supabase (required for real launch)',
              '5 · Launch-readiness checklist', '6 · Troubleshooting']:
        story.append(Paragraph(f'•  {t}', st('toc', fontSize=10.5, leading=17)))
    story.append(PageBreak())

    # 1 Vercel
    story += h2('1', 'Deploy to Vercel', 'The code is committed and pushed. This section covers the account-side deploy (~15 minutes).')
    story += h3('Before you start')
    for t in [
        'Create a Vercel account at vercel.com — sign up with your GitHub account.',
        'If the app branch isn\u2019t merged yet: open a PR from arena/01a03b32-my-personal-website to main in GitHub, merge it, then import. (Vercel deploys main by default; you can also pick the branch during import.)',
    ]:
        story += step('•', t)
    story += h3('Deploy steps')
    for t in [
        ('1', 'Vercel → Add New… → Project → import my-personal-website.'),
        ('2', 'Framework: Next.js auto-detected. Keep defaults (Build: npm run build, Root: ./).'),
        ('3', 'Environment Variables → add:'),
    ]:
        story += step(t[0], t[1])
    story.append(table_flowable([
        ['Key', 'Value', 'Notes'],
        ['APP_SECRET', 'openssl rand -hex 32 output', 'Signs sessions, carts, download tokens — keep secret'],
        ['NEXT_PUBLIC_SITE_URL', 'https://<your-app>.vercel.app', 'Update after first deploy; used for email links + sitemap'],
        ['DOWNLOAD_LINK_TTL_SECONDS', '172800', 'Optional — 48 h default'],
        ['RESEND_API_KEY', 're_… (optional)', 'Real transactional email; without it emails are logged'],
    ], minwidths=[90, 130, 190]))
    for t in [
        ('4', 'Deploy. First build ≈ 2–3 minutes → you get a live URL.'),
        ('5', 'Smoke test the demo flow on the live URL: shop → add pack → checkout → MTN MoMo → “Approve payment” (demo) → downloads unlock.'),
        ('6', 'Log in as admin (admin@cudjoe.digital / admin123) → Admin → revenue analytics.'),
        ('7', 'Set the final NEXT_PUBLIC_SITE_URL → Redeploy. Optional: add a custom domain in Settings → Domains.'),
    ]:
        story += step(t[0], t[1])
    story.append(Paragraph(inline('<b>Demo caveat:</b> with no Paystack key, the “Approve payment” button simulates the phone prompt. Section 2 replaces it with the real MTN MoMo / Telecel Cash flow.'), S['body']))
    story.append(PageBreak())

    # 2 Paystack
    story += h2('2', 'Real mobile money via Paystack', 'The Paystack integration is fully implemented (initialize → webhook → unlock). You supply the account, keys and webhook URL.')
    story += h3('2a · Create & verify your Paystack (Ghana) account')
    for t in [
        ('1', 'paystack.com → Create free account → country: Ghana.'),
        ('2', 'Complete business settings: name, registration, address, settlement bank account, phone.'),
        ('3', 'Complete KYC (business registration + director ID). Verification takes 1–3 business days — start now; other steps can run in parallel.'),
        ('4', 'Dashboard → Settings → API Keys & Webhooks → copy Secret Key (sk_live_…) and Public Key (pk_live_…).'),
    ]:
        story += step(t[0], t[1])
    story += h3('2b · Set keys on Vercel')
    for t in [
        ('1', 'Vercel → Settings → Environment Variables → Production: PAYSTACK_SECRET_KEY + PAYSTACK_PUBLIC_KEY.'),
        ('2', '(Optional fallback gateway) FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_WEBHOOK_SECRET, PAYMENT_GATEWAY=flutterwave.'),
        ('3', 'Redeploy. The code auto-switches from the demo gateway to real Paystack — no code changes. Webhook signing uses PAYSTACK_SECRET_KEY.'),
    ]:
        story += step(t[0], t[1])
    story += h3('2c · Configure the webhook (unlocks downloads instantly)')
    story.append(Paragraph(inline('Paystack dashboard → Settings → API Keys & Webhooks → Webhook URL:'), S['body']))
    story.append(code_block('https://<your-app>.vercel.app/api/webhooks/paystack'))
    for t in [
        ('1', 'Save (charge.success is enabled by default).'),
        ('2', 'Test: “Send test webhook” on the same page → Vercel Functions → Logs shows POST /api/webhooks/paystack returning 200.'),
        ('3', 'The handler verifies the HMAC-SHA512 signature, is idempotent (duplicates can\u2019t double-fulfill) and acknowledges fast.'),
    ]:
        story += step(t[0], t[1])
    story += h3('2d · Real test purchases (required before launch)')
    story.append(table_flowable([
        ['#', 'Product', 'Payment', 'Verify'],
        ['T1', 'Prompt pack (GH₵ 75)', 'MTN MoMo 024/…', 'Paystack page → approve with PIN → Word + PDF download'],
        ['T2', 'Ebook (GH₵ 185)', 'Telecel Cash 020/…', 'EPUB download → switch to PDF in My Downloads'],
        ['T3', 'Bundle (GH₵ 319)', 'MTN MoMo', 'ZIP downloads and extracts (packs + ebook + README)'],
        ['T4', 'Failure drill', 'MTN MoMo (decline)', '“Payment wasn’t completed” page; cart preserved; no charge'],
        ['T5', 'Invalid number', '020 with MoMo', 'Inline validation blocks checkout before payment'],
    ], minwidths=[24, 110, 80, 200]))
    story.append(Paragraph(inline('Production flow: checkout → Paystack initialize (GHS, mobile_money, channel per your selection) → buyer approves USSD/app push with PIN → charge.success webhook → signature verified → order paid → downloads + email unlocked → Paystack redirects back to your pay page (callback_url pre-set with the order id) → confirmation + downloads.'), S['body']))
    story += h3('2e · Refunds')
    for t in [
        ('•', 'Gateway side: Paystack → Transactions → Refund (back to the buyer\u2019s wallet).'),
        ('•', 'Store side: admin → Orders → refunded orders are rejected by the download route automatically (403). Keep both in sync.'),
    ]:
        story += step(t[0], t[1])
    story.append(PageBreak())

    # 3 CI
    story += h2('3', 'Enable the CI workflow', 'The file .github/workflows/ci.yml exists in the project but wasn\u2019t pushed (this sandbox token lacks the workflows permission). Push it with your own account.')
    story += h3('Option A — push from your machine')
    story.append(code_block('git add .github/workflows/ci.yml\ngit commit -m "Enable CI: typecheck + build on push"\ngit push'))
    story += h3('Option B — create it in the GitHub web UI')
    story.append(Paragraph(inline('Repo → Add file → Create new file → path <code>.github/workflows/ci.yml</code> → paste:'), S['body']))
    story.append(code_block('''name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
        env:
          APP_SECRET: ci-secret
          NEXT_PUBLIC_SITE_URL: http://localhost:3000'''))
    for t in [
        ('1', 'Commit → Actions tab runs CI (≈3 min). Green = live.'),
        ('2', '(Optional) Protect main: Settings → Branches → require the “build” check.'),
    ]:
        story += step(t[0], t[1])
    story.append(PageBreak())

    # 4 Supabase
    story += h2('4', 'Production data: switch to Supabase (required before real launch)',
                'The built-in demo database (.data/db.json) cannot persist writes on Vercel\u2019s serverless filesystem. Real sales need the Postgres layer.')
    for t in [
        ('1', 'Create a free Supabase project (supabase.com → New project).'),
        ('2', 'SQL Editor → paste db/schema.sql (already in the repo) → Run.'),
        ('3', 'Storage → buckets: product-files (Private) + samples, covers (Public).'),
        ('4', 'Upload product files into the buckets following the paths in lib/catalogData.ts (e.g. prompts/pkg-fre-01/pack.pdf).'),
        ('5', 'Set env vars on Vercel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET.'),
        ('6', 'Swap the data layer: replace lib/store.ts + lib/catalog.ts implementations with Supabase queries keeping the same exported functions (≈1–2 days).'),
        ('7', 'Re-run tests T1–T5 against Supabase, then delete .data/db.json.'),
    ]:
        story += step(t[0], t[1])
    story.append(PageBreak())

    # 5 checklist
    story += h2('5', 'Launch-readiness checklist')
    story.append(table_flowable([
        ['Item', 'Status'],
        ['Vercel deploy live; custom URL set; NEXT_PUBLIC_SITE_URL updated + redeployed', '☐'],
        ['Paystack Ghana verified; live keys on Vercel; webhook URL registered', '☐'],
        ['Webhook test: charge.success in Vercel logs with HTTP 200', '☐'],
        ['T1 prompt pack via MTN MoMo — paid, Word+PDF downloaded, email received', '☐'],
        ['T2 ebook via Telecel Cash — EPUB downloaded, PDF format-switch works', '☐'],
        ['T3 bundle via MoMo — ZIP downloaded and extracted', '☐'],
        ['T4/T5 failure drills pass (declined payment page, phone validation)', '☐'],
        ['Refunds: gateway refund + admin order state sync tested', '☐'],
        ['Supabase adapter live — orders persist across restarts', '☐'],
        ['CI green on main; branch protection on (optional)', '☐'],
        ['RESEND_API_KEY set; receipt email arrives', '☐'],
        ['Support inbox + WhatsApp set up (real contacts in footer)', '☐'],
    ], minwidths=[320, 40]))
    story.append(PageBreak())

    # 6 troubleshooting
    story += h2('6', 'Troubleshooting')
    story.append(table_flowable([
        ['Symptom', 'Cause → Fix'],
        ['Checkout still shows the demo “Approve payment” button', 'PAYSTACK_SECRET_KEY missing (or not redeployed) → add key → Redeploy'],
        ['Webhook returns 401 in logs', 'Signature mismatch — our handler signs with PAYSTACK_SECRET_KEY; ensure the live key matches the dashboard'],
        ['Buyer pays but no downloads', 'Webhook URL wrong/unsaved, or charge.success disabled → re-check 2c; reconcile via admin or the /verify fallback endpoint'],
        ['“Invalid phone number” on a valid number', 'Prefix/network mismatch — MTN: 024/054/055/059 · Telecel: 020/026/027/050'],
        ['Orders disappear after a while', 'Demo DB on serverless — Section 4 (Supabase) is mandatory for production'],
        ['410 “link invalid or expired”', 'Normal — links expire after 48 h; generate a fresh one from My Downloads'],
        ['CI won\u2019t run after pushing', 'Pushed via a token without workflows permission → push .github/workflows/ci.yml with your own account (Section 3)'],
    ], minwidths=[160, 260]))

    doc = Doc(OUT, meta)
    doc.multiBuild(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_meta=meta, **k))
    print('Built', OUT)

if __name__ == '__main__':
    main()
