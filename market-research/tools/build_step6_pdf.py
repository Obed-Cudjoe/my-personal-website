#!/usr/bin/env python3
"""Step 6 — Development Roadmap & Sprint Plan PDF generator.
Reuses the shared report template (fonts, palette, NumberedCanvas, tables).
Usage: python3 tools/build_step6_pdf.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib import colors
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, NextPageTemplate)
from report_pdf_template import (NAVY, TEAL, INDIGO, INK, MUTED, LINE, SOFT, WHITE,
                                 A4, cm, USABLE_W, PAGE_W, PAGE_H, M_L, M_R, M_T, M_B,
                                 NumberedCanvas, inline, table_flowable, st, S)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'market-research', 'step-6-development-roadmap-and-sprint-plan.pdf')

# ---------------------------------------------------------------- data
WEEKS = [
    dict(n=1, title='Foundation & Data Layer',
         focus='Project setup, database schema with product types, authentication, and file storage configuration.',
         tasks=[('Create GitHub repo; scaffold Next.js 14 + TypeScript + Tailwind; first Vercel deploy', 6, '—'),
                ('Supabase project, env vars, schema.sql migration + seed script (products, orders, payments, downloads, bundle_items)', 8, 'repo'),
                ('Supabase Auth: email + OTP, session cookie, middleware guard, admin role claim', 8, 'schema'),
                ('Storage: private product-files bucket + public samples/covers buckets, RLS policies, MIME/size validation helper', 5, 'supabase'),
                ('lib layer: supabase client/server/admin, storage helper (signed URLs), error envelope', 5, 'auth'),
                ('Base UI shell: navbar, footer, product card skeletons with type badges', 5, '—'),
                ('README, lint + typecheck CI, weekly smoke test', 3, '—')],
         deliverables=['Repo live on Vercel', 'Schema applied with seed data',
                       'Email/OTP auth working with protected routes', 'Storage buckets + RLS configured',
                       'Base components rendered on home page'],
         exit_criteria='Sign in via OTP email · insert a test product row via admin route · upload a test file to the private bucket · deploy pipeline green.',
         buffer='Friday buffer for tooling surprises (Tailwind/Next versions, Supabase auth config).'),
    dict(n=2, title='Storefront: Shop, Prompt & Ebook Pages',
         focus='Storefront frontend with product type filtering, prompt product pages, and ebook product pages.',
         tasks=[('Shop page: type tabs (All/Prompts/Ebooks/Bundles) + category filter + search + sort', 10, 'W1 UI shell'),
                ('GET /api/products with type/category/q/sort filtering', 4, 'schema'),
                ('Prompt product page: count, formats, sample previews, What’s inside', 6, 'API'),
                ('Ebook product page: cover, synopsis, TOC accordion, author, page count, PDF/EPUB toggle, free chapter', 10, 'API'),
                ('Seed 6 starter products (2 packs + 2 ebooks + 2 bundles placeholder data)', 4, 'API'),
                ('Mobile polish: skeleton states, sticky add-to-cart bar, empty states', 4, 'pages'),
                ('Weekly smoke test + content quota check-in', 2, '—')],
         deliverables=['/shop filters by type and category', 'Prompt product page template',
                       'Ebook product page with format toggle + sample chapter', '6 seeded product pages'],
         exit_criteria='Type tabs filter correctly · ebook format selection persists · samples render from storage.',
         buffer='Ebook page is the most complex storefront page — keep it above the fold and touch-test on 360 px early.'),
    dict(n=3, title='Bundles, Cart & Format Selection',
         focus='Bundle product pages, cart system, and format selection at checkout.',
         tasks=[('Bundle product page: itemized list with descriptions, combined value strikethrough, savings badge', 6, 'W2 API'),
                ('Bundle API + bundle_items seeding', 4, 'schema'),
                ('Cart API: add/update/remove with format per item; guest localStorage sync + server persistence', 10, 'W2'),
                ('Cart UI: type badges, per-item format selector, savings summary', 6, 'cart API'),
                ('Checkout step 1: contact form, format confirmation, payment method radio (MTN MoMo / Telecel Cash)', 8, 'cart UI'),
                ('Order + payment records created on submit (pending state, idempotency key)', 6, 'schema'),
                ('Validation: email format, Ghana phone prefixes (024/054/055/059, 020/026/027/050)', 3, '—')],
         deliverables=['Cart works for all 3 product types', 'Checkout step 1 creates pending order + payment',
                       'Bundle pages show real savings', 'Format selection locked per item'],
         exit_criteria='Add/change/remove items with formats · invalid phone shows inline error · order + payment rows persist.',
         buffer='Guest cart sync is the fiddly part — keep localStorage and server cart in one source of truth from day one.'),
    dict(n=4, title='Payments: MTN MoMo + Telecel Cash + Webhooks',
         focus='Payment integration with mobile money and Telecel Cash including webhook setup. Do not rush this week.',
         tasks=[('Paystack test keys; /api/checkout → /transaction/initialize (GHS, mobile_money, channel per method)', 6, 'W3'),
                ('Checkout step 2: amount + phone display, USSD/app prompt status, polling GET /api/orders/[id]', 8, 'W3'),
                ('Webhook route: raw body, x-paystack-signature HMAC verify, idempotency on reference', 8, 'checkout'),
                ('Fulfillment trigger on charge.success (order → paid, queue delivery)', 6, 'webhook'),
                ('Flutterwave fallback client + webhook (Verif-Hash) + PAYMENT_GATEWAY flag', 6, 'paystack'),
                ('Gateway-down banner + retry affordances on step 2', 4, '—'),
                ('Test-mode end-to-end: sandbox MoMo purchase completes', 4, 'all')],
         deliverables=['Test-mode MoMo purchase completes end-to-end', 'Webhook verified with signature check',
                       'Order transitions pending → paid only via verified webhook', 'Flutterwave fallback wired'],
         exit_criteria='Sandbox payment → webhook → order paid · duplicate webhook returns 200 without double fulfillment · bad signature → 401.',
         buffer='Reserve 2 extra days: gateway sandbox quirks and webhook delivery delays are the #1 source of slippage.'),
    dict(n=5, title='Delivery: Files, Signed URLs & Bundle ZIPs',
         focus='File delivery for single files and bundle ZIP generation with signed URLs.',
         tasks=[('Signed URL generation: createSignedUrl(path, 172800) with 48-h TTL', 4, 'W4 paid state'),
                ('downloads table + GET/POST /api/downloads with access validation + format switching', 8, 'schema'),
                ('Download route: verify paid order + ownership → 302 to signed URL → log download', 6, 'signed URLs'),
                ('Bundle ZIP builder: admin-triggered build, versioned storage, integrity check', 8, 'storage'),
                ('Lazy ZIP fallback route (stream parts, archiver) if stored ZIP missing', 6, 'builder'),
                ('Email (Resend): receipt + links; SMS stub (Termii/Arkesal) with toggle', 6, '—'),
                ('Range/resume verification for large files', 2, '—')],
         deliverables=['Paid orders get working signed links', 'Format switching works (PDF bought → EPUB downloadable)',
                       'Bundle ZIPs build and download', 'Email receipts with links sent'],
         exit_criteria='Paid order → signed link works for guest + user · expired link shows friendly error · ZIP extracts cleanly.',
         buffer='ZIP builder first run will exceed expectations — build once at publish time, never at checkout.'),
    dict(n=6, title='User & Admin Dashboards',
         focus='User dashboard with purchase history and re-download; admin dashboard with product upload for all three types and bundle creation.',
         tasks=[('Account dashboard: guard, purchases list, quick actions', 4, 'auth'),
                ('Purchase history page: orders, dates, amounts, receipts', 4, 'orders'),
                ('Downloads page: all formats per product, fresh-link generation, expiry notice', 6, 'W5'),
                ('Admin: products CRUD for prompts + ebooks (typed forms, file upload, previews)', 8, 'auth admin'),
                ('Admin: bundle builder — pick products, auto value/savings, ZIP trigger', 8, 'products CRUD'),
                ('Admin: orders list + search, resend links, mark refunded (revokes downloads)', 6, '—'),
                ('Admin: KPI endpoints + charts (revenue by day/type/category, top products)', 6, '—')],
         deliverables=['Re-download in a different format works', 'Admin can publish all 3 product types',
                       'Bundle builder computes savings + builds ZIP', 'Orders manageable (resend/refund)'],
         exit_criteria='Returning user re-downloads EPUB for a PDF purchase · admin-created product appears in shop · refund blocks download route.',
         buffer='Admin forms mirror the product types — build one typed form component, not three.'),
    dict(n=7, title='Content Sprint: Writing, Formatting, Covers, Bundles',
         focus='Content creation and upload: writing prompt packs, formatting ebooks in PDF and EPUB, designing covers, creating tables of contents, and building bundle packages.',
         tasks=[('Finish remaining ebook manuscripts (2–3 books to complete)', 12, 'content calendar'),
                ('Format all 5 ebooks: PDF (6×9) + EPUB, TOC, headers, proof pass (buffer-heavy)', 20, 'manuscripts'),
                ('Design 7 covers (5 ebooks + 2 lead magnets) at 600×900', 6, '—'),
                ('Final QA on all prompt packs: re-test on ChatGPT/Claude/Gemini, update changelogs', 10, 'content'),
                ('Build 3 bundle ZIPs; verify extraction + file lists + README + license', 4, 'products'),
                ('Upload everything via admin; write store copy for all 23 products', 6, 'admin W6'),
                ('Staging deploy + full content review pass', 4, '—')],
         deliverables=['All 23 products live with real content', 'All formats present (Word+PDF, PDF+EPUB, ZIP)',
                       'Covers designed and uploaded', 'Bundles assembled and extract-tested'],
         exit_criteria='Every product page renders real content · samples downloadable · ZIPs extract cleanly · zero placeholder text.',
         buffer='Ebook formatting takes 2–3× longer than writing. This week is budgeted with a 1.5× buffer on formatting alone.'),
    dict(n=8, title='E2E Testing, Fixes & Launch',
         focus='End-to-end testing, bug fixes, mobile optimization, and launch preparation.',
         tasks=[('Real-money E2E: prompt pack via MTN MoMo (GH₵ 75)', 3, 'W7 content'),
                ('Real-money E2E: ebook via Telecel Cash with format switch (GH₵ 185)', 3, 'W7 content'),
                ('Real-money E2E: bundle via MoMo + ZIP download (GH₵ 319)', 3, 'W7 content'),
                ('Failure drills: insufficient balance, declined, timeout, duplicate webhook, expired link, interrupted download', 5, '—'),
                ('Mobile device pass: Android Chrome, iOS Safari, 360 px, 3G throttle', 6, '—'),
                ('Copy/legal/refund/delivery pages review; support inbox + WhatsApp setup', 3, '—'),
                ('Bug-fix burn-down to zero P0/P1', 10, 'tests'),
                ('Launch checklist sign-off, go-live deploy, post-launch monitoring', 4, 'all')],
         deliverables=['Three real-money purchases verified (one per product type)', 'Test report with screenshots',
                       'Zero P0/P1 bugs', 'Launch day runbook + monitoring'],
         exit_criteria='All E2E and failure tests pass · real payments confirmed on MTN and Telecel · store deployed and monitored.',
         buffer='Real-money tests need 2–3 days (network delays, refund processing). Budget ~GH₵ 600 for test purchases and refund them after.' ),
]

DAILY_W1 = [
    ['Day', 'Focus', 'Key tasks', 'Done when'],
    ['Mon', 'Repo + deploy', 'Create GitHub repo; scaffold Next.js 14 + TS + Tailwind; set lint/typecheck; import to Vercel; first deploy.', 'https://…vercel.app loads; CI green.'],
    ['Tue', 'Database', 'Supabase project; env vars; write schema.sql (products w/ product_type + formats[], orders, payments, downloads, bundle_items, profiles, subscribers); run migration; seed script.', 'Tables visible in Supabase dashboard; seed runs.'],
    ['Wed', 'Authentication', 'Supabase Auth email + OTP; session cookie; middleware guard on /account and /admin; admin role claim in profiles.', 'Protected route redirects; OTP email arrives and logs in.'],
    ['Thu', 'Storage', 'Buckets: product-files (private), samples + covers (public); RLS policies; upload helper with MIME + 50 MB size validation.', 'Service-role upload works; anonymous read blocked on private bucket.'],
    ['Fri', 'Lib + UI shell', 'lib clients (server/admin), storage helper (signed URL fn), error envelope; base UI: navbar, footer, product card skeleton, type badges.', 'Home renders shell; lint + typecheck pass.'],
    ['Sat', 'Lead magnet', 'subscribers table; POST /api/lead-magnets; /free/[slug] capture page; Resend email with sample link.', 'Email captured; sample download link delivered.'],
    ['Sun', 'Buffer + review', 'Catch-up on any slipped task; code review pass; README; update risk log; prep Week 2.', 'Week 1 exit criteria all met.'],
]

CONTENT_ROWS = [
    ['Artifact', 'Count', 'Est. hours', 'Weeks', 'Milestone'],
    ['Lead magnet: 5 free prompts + “The Prompt Recipe” mini-ebook', '2', '8', 'W1–W2', 'Lead capture live at launch'],
    ['Starter prompt packs (12–15 prompts each)', '6', '20', 'W2–W4', 'Shop populated from W2'],
    ['System prompt packs (35–45 prompts each)', '6', '30', 'W4–W6', 'Tested on 3 models'],
    ['Dev/analyst packs (15–40 prompts)', '3', '18', 'W5–W6', 'Tested on 3 models'],
    ['Ebook manuscripts (36–52 pp each)', '5', '55', 'W4–W7', '1 book drafted per week from W4'],
    ['Ebook formatting: PDF + EPUB, TOC, proof pass (buffer ×1.5)', '5', '35', 'W6–W7', 'Device-tested on Kindle/Kobo/Apple'],
    ['Covers: 5 ebooks + 2 lead magnets (600×900)', '7', '15', 'W6–W7', 'Uploaded with products'],
    ['Bundle assembly: ZIPs + README + license + extract test', '3', '9', 'W7', 'Bundles live'],
    ['Upload via admin + store copy for all products', '23', '12', 'W7–W8', 'No placeholder text'],
]

CONTENT_WEEKLY = [
    ['Week', 'Content work (alongside dev sprints)'],
    ['W1', 'Write lead-magnet pack (5 prompts) + outline all 5 ebooks (TOC skeletons).'],
    ['W2', 'Draft 2 starter packs (freelance outreach, marketing ads) · ebook 1 outline → first chapters.'],
    ['W3', 'Draft 2 starter packs (SMB, creators) · ebook 1 manuscript continues; ebook 2 outline.'],
    ['W4', 'Draft system pack (freelance) · finish ebook 1 manuscript · ebook 2 draft starts.'],
    ['W5', 'Draft 2 system packs (marketing, creators) · ebook 2 manuscript; ebook 3 outline.'],
    ['W6', 'Draft system pack (SMB) + dev packs 1–2 · ebook 3 manuscript; ebook 4 draft · cover art begins.'],
    ['W7', 'Finish dev system pack + ebook 5 · format ALL ebooks (PDF+EPUB) · covers · bundle ZIPs · upload.'],
    ['W8', 'Content QA on staging, fix formatting issues, verify samples and downloads.'],
]

E2E_ROWS = [
    ['Test', 'Flow', 'Payment', 'Pass criteria'],
    ['T1', 'Prompt pack: shop → product page → cart → checkout → pay → download Word+PDF', 'MTN MoMo · real GH₵ 75', 'Files download; email + SMS links received; order paid; re-download works.'],
    ['T2', 'Ebook with format selection: choose EPUB at product page, confirm at checkout, buy, download EPUB, then switch to PDF in dashboard', 'Telecel Cash · real GH₵ 185', 'EPUB downloaded; PDF available in dashboard; both open correctly.'],
    ['T3', 'Bundle: product page shows savings → cart → pay → ZIP download', 'MTN MoMo · real GH₵ 319', 'ZIP downloads, extracts to 3 products + README; file counts and sizes match.'],
    ['T4', 'Guest checkout: buy without account; recover links via email order lookup', 'MTN MoMo · GH₵ 75', 'Guest receives links by email; can re-download via email token.'],
    ['T5', 'Returning user: login → downloads → refresh expired link → download new format', '—', 'Fresh 48-h link generated; old token rejected.'],
    ['T6', 'Refund: admin marks refunded → download attempts blocked', '—', 'Download route returns 403; buyer sees notice.'],
]

FAIL_ROWS = [
    ['Failure', 'Simulation', 'Expected behavior'],
    ['Insufficient balance', 'Use a number with low balance', 'Friendly error; order stays pending; retry allowed.'],
    ['Payment declined', 'Gateway declines (test code)', 'Order failed; buyer informed; cart preserved.'],
    ['Network timeout', 'Approve on phone, kill the confirmation page', 'Polling + “I’ve approved” button; webhook still fulfills when it arrives.'],
    ['Webhook missed', 'Block the webhook URL; then unblock', 'Paystack retries; manual verify endpoint reconciles; order fulfills.'],
    ['Duplicate webhook', 'Replay the same payload twice', 'Second request returns 200; no double fulfillment (idempotency).'],
    ['Invalid signature', 'Send payload with wrong header', '401; no side effects.'],
    ['Invalid phone number', 'Enter malformed prefix', 'Inline validation blocks before payment init.'],
    ['Gateway down', 'Stop the gateway (env flag switch)', 'Banner on checkout; no order created; fallback gateway available.'],
    ['Expired link', 'Wait past TTL (test with short TTL in staging)', 'Friendly expiry message + “get new link” path.'],
    ['Interrupted download', 'Kill network mid-ZIP', 'Resume via Range requests; fresh token on retry.'],
    ['Duplicate charge', 'Pay twice (same reference)', 'One order; duplicate auto-refunded; receipt emailed.'],
]

DELIVERY_ROWS = [
    ['Test', 'Detail'],
    ['D1 · Format switching', 'Buy PDF ebook → download EPUB from dashboard → verify both render.'],
    ['D2 · Signed URL expiry', 'Staging TTL set to 60 s; wait; confirm expiry message + fresh link works.'],
    ['D3 · Tampered token', 'Modify one character of the signed URL; expect 403.'],
    ['D4 · ZIP integrity', 'Download each bundle ZIP; extract; verify file list, sizes, MIME of inner files, README present.'],
    ['D5 · Range/resume', 'Throttle to 3G; pause mid-download; resume; verify checksum of final file.'],
    ['D6 · Unsupported format', 'Open EPUB on a device without a reader; confirm guidance + PDF fallback link shown.'],
    ['D7 · MIME headers', 'curl -I each download type: expect application/pdf, …docx, application/epub+zip, application/zip.'],
]

DEVICE_ROWS = [
    ['Device / condition', 'Pass criteria'],
    ['Android Chrome (Galaxy A-class, 360 px)', 'Full purchase flow; MoMo USSD prompt opens; downloads save.'],
    ['iOS Safari (iPhone SE/12, 375 px)', 'Full flow; Telecel prompt; downloads open in Books.'],
    ['3G / slow network', 'Store loads < 5 s; skeleton states; large ZIP shows progress; resume works.'],
    ['Desktop (Chrome, 1440 px)', 'Full flow; admin dashboard usable.'],
    ['Offline / back button', 'Cart and checkout state preserved; no duplicate orders.'],
]

CHECKLIST = [
    ('Code & infrastructure', [
        'Zero P0/P1 bugs; bug list reviewed and closed',
        'Deploys from main are green; production env vars set',
        'Supabase backups confirmed (daily); monitoring alerts configured',
        'Error tracking readable (Vercel + Supabase logs)',
    ]),
    ('Payments', [
        'Paystack live keys active (Ghana business verification complete)',
        'Webhook URL live in Paystack dashboard; charge.success enabled',
        'Real purchases verified on MTN MoMo AND Telecel Cash',
        'Refund flow tested (order → refunded → downloads blocked)',
        'Fallback gateway switch rehearsed once',
    ]),
    ('Delivery', [
        'All 23 products have all formats uploaded (Word+PDF / PDF+EPUB / ZIP)',
        'Signed URLs expire at 48 h and regenerate from dashboard',
        'Format switching verified for every ebook',
        'Bundle ZIPs extract-tested; README + license included',
        'Email templates reviewed on mobile; SMS links (if enabled) tested',
    ]),
    ('Content', [
        'No placeholder text anywhere; prices in GH₵ correct',
        'Covers final at 600×900; TOC accurate and hyperlinked in EPUB',
        'Every prompt pack re-tested on ChatGPT/Claude/Gemini after last edits',
        'Samples (3 prompts / Chapter 1) downloadable on product pages',
    ]),
    ('Legal & operations', [
        'Terms, privacy, refund policy, delivery info pages live',
        '14-day refund process documented; support inbox + WhatsApp set up',
        'Test purchases refunded and reconciled',
    ]),
    ('Marketing & launch day', [
        'Lead magnets live and email-gated',
        'Launch post/social plan ready; analytics recording',
        'Go-live: final deploy, smoke purchase, watch webhooks for 30 min',
        'Post-launch checklist: monitor first 10 orders, confirm settlement, note pain points',
    ]),
]

RISKS = [
    ['Risk', 'Likelihood', 'Impact', 'Mitigation'],
    ['Paystack live-key verification delayed (business registration)', 'Medium', 'High — cannot take real payments', 'Start verification in W1; launch can slip days, not weeks; Flutterwave as second path.'],
    ['Ebook formatting takes longer than expected', 'High', 'Medium — content slip', '1.5× buffer in W7; start formatting W6; ship 3 books first if needed.'],
    ['Content backlog vs. development pace', 'Medium', 'High — empty store', 'Content starts W1 with weekly quotas; drop to 3 categories for MVP if slipping.'],
    ['Model updates change prompt behavior', 'Medium', 'Low–Medium', 'Weekly re-test on 3 models; changelog + update emails (built into product promise).'],
    ['Webhook delays / missed deliveries', 'Low', 'Medium', 'Polling + verify endpoint + admin reconcile (from Step 5).'],
    ['Storage nears 1 GB free tier', 'Low (months 9–10)', 'Low', 'Monthly check; compress ebooks; R2 migration plan (Step 5).'],
    ['Vercel function timeout on ZIP edge case', 'Low', 'Low', 'Pre-built ZIPs; lazy fallback streams; Fluid compute if needed.'],
    ['Solo-dev illness / burnout', 'Low', 'High', '6-day weeks + Sunday buffer; scope fallbacks defined (3-category MVP).'],
]

# ---------------------------------------------------------------- document
def main():
    meta = dict(
        header_left='Digital Marketplace Launch Plan',
        header_right='Cudjoe Digital Studio',
        footer_left='Step 6 — Development Roadmap & Sprint Plan',
        title='Development Roadmap & Sprint Plan',
        author='Obed Cudjoe',
        subject='8-week solo-developer build plan for the digital product marketplace',
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
        els.append(Paragraph('Development Roadmap & Sprint Plan · Step 6 of 6', S['cover-step']))
        els.append(Spacer(1, 0.45*cm))
        els.append(Paragraph('Development Roadmap\n& Sprint Plan', S['cover-title']))
        els.append(Spacer(1, 0.55*cm))
        bar = Table([['']], colWidths=[2.4*cm], rowHeights=[0.14*cm])
        bar.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), TEAL)]))
        els.append(bar)
        els.append(Spacer(1, 0.55*cm))
        els.append(Paragraph('An 8-week, week-by-week build plan for a solo full-stack developer — milestones, sprint deliverables, page builds, integrations, content creation for prompts and ebooks, dependencies, buffers, and a launch-ready testing regime.',
                             S['cover-sub']))
        els.append(Spacer(1, 1.7*cm))
        chips = [[Paragraph(c, S['chip'])] for c in [
            'Date: August 25, 2026', 'Timeline: 8 weeks · solo developer',
            'Content: 15 packs · 5 ebooks · 3 bundles · 2 magnets', 'Critical path: payments → delivery']]
        ct = Table(chips, colWidths=[9.0*cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2A3D66')),
            ('BOX', (0,0), (-1,-1), 0.6, colors.HexColor('#FFFFFF40')),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 12)]))
        els.append(ct)
        els.append(Spacer(1, 2.4*cm))
        els.append(Paragraph('Step 6 of 6 · Development Roadmap & Sprint Plan', S['cover-foot']))
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
    toc = ['1 · Roadmap at a Glance (8 weeks + workstream grid)', '2 · Week-by-Week Development Plan',
           '3 · Week 1 Sprint Plan — Daily Tasks', '4 · Content Creation Schedule',
           '5 · Testing Plan', '6 · Launch Readiness Checklist', '7 · Risks & Buffers']
    for t in toc:
        story.append(Paragraph(f'•  {t}', st('toc', fontSize=10.5, leading=17)))
    story.append(PageBreak())

    # 1 overview
    story += h2('1', 'Roadmap at a Glance',
                '8 weeks for a solo full-stack developer. Payments and delivery are the critical path — they get two focused weeks plus buffers. Content creation overlaps development from week 1 so the store is never empty at launch.')
    ov = [['Wk', 'Milestone', 'Focus', 'Exit criteria']]
    for w in WEEKS:
        ov.append([f'W{w["n"]}', w['title'], w['focus'][:95], w['exit_criteria'][:70]])
    story.append(table_flowable(ov, minwidths=[24, 90, 170, 130]))
    story.append(Spacer(1, 0.3*cm))

    story += h3('Workstream timeline grid')
    grid_rows = [
        ['Workstream', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        ['Foundation & data', '■', '', '', '', '', '', '', ''],
        ['Storefront (shop + product pages)', '', '■', '□', '', '', '', '', ''],
        ['Cart & checkout UI', '', '', '■', '□', '', '', '', ''],
        ['Payments + webhooks', '', '', '', '■', '■', '', '', ''],
        ['Delivery + ZIP + signed URLs', '', '', '', '', '■', '□', '', ''],
        ['User & admin dashboards', '', '', '', '', '', '■', '□', ''],
        ['Content writing (packs + ebooks)', '□', '□', '□', '■', '■', '■', '□', ''],
        ['Formatting, covers, upload', '', '', '', '', '', '□', '■', ''],
        ['E2E testing & launch', '', '', '', '', '', '', '□', '■'],
    ]
    legend = '■ = primary focus · □ = supporting / ramp-down activity'
    gt = Table(grid_rows, colWidths=[150] + [43]*8)
    style = [
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, LINE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('FONT', (0,1), (0,-1), 'DejaVu-Bold', 8),
    ]
    # color cells
    fillmap = {'■': NAVY, '□': colors.HexColor('#B9CDEB')}
    for r in range(1, len(grid_rows)):
        for c in range(1, 9):
            v = grid_rows[r][c]
            if v in fillmap:
                style.append(('BACKGROUND', (c, r), (c, r), fillmap[v]))
                grid_rows[r][c] = ''
    for r in range(1, len(grid_rows)):
        style.append(('TEXTCOLOR', (0, r), (0, r), NAVY))
    gt.setStyle(TableStyle(style))
    story.append(gt)
    story.append(Spacer(1, 0.1*cm))
    story.append(Paragraph(legend, S['sub']))
    story.append(Spacer(1, 0.3*cm))

    story += h3('Guiding principles')
    for p in [
        'Payments and delivery are the highest-risk features — they own two full weeks each (W4–W5) plus testing time in W8, and are never compressed for other work.',
        'Content creation starts in week 1 and runs in parallel with development (weekly quota system), so the week-7 content sprint only finishes formatting and uploads — it does not start writing from zero.',
        'Ebook formatting is budgeted at 1.5× the raw estimate; covers and EPUB device-testing sit inside that buffer.',
        'Every week ends with an exit-criteria check; any missed criterion is resolved before starting the next milestone.',
        'MVP scope control: if content slips, the store can launch with 3 categories (freelance, marketing, creators) rather than delaying the launch.',
    ]:
        story.append(Paragraph(f'•  {p}', st('bp', fontSize=9.2, leading=13, spaceAfter=5, leftIndent=10)))
    story.append(PageBreak())

    # 2 weeks detail
    story += h2('2', 'Week-by-Week Development Plan',
                'Each week: focus, named deliverables, task list with hours and dependencies, exit criteria, and a buffer note.')
    for w in WEEKS:
        story += h3(f'Week {w["n"]} — {w["title"]}')
        story.append(Paragraph(inline(f'<b>Focus:</b> {w["focus"]}'), st('wf', fontSize=9.4, leading=13, spaceAfter=6)))
        rows = [['Task', 'Hrs', 'Depends on']]
        for task, hrs, dep in w['tasks']:
            rows.append([task, hrs, dep])
        story.append(table_flowable(rows, minwidths=[250, 28, 60]))
        story.append(Spacer(1, 0.1*cm))
        dels = ' · '.join(w['deliverables'])
        story.append(Paragraph(f'<b>Deliverables:</b> {inline(dels)}', st('dl', fontSize=8.8, leading=12.4, spaceAfter=4)))
        story.append(Paragraph(f'<b>Exit criteria:</b> {inline(w["exit_criteria"])}', st('ec', fontSize=8.8, leading=12.4, spaceAfter=3)))
        story.append(Paragraph(f'<b>Buffer:</b> {inline(w["buffer"])}', st('bf', fontSize=8.8, leading=12.4, spaceAfter=10, textColor=MUTED)))
    story.append(PageBreak())

    # 3 week 1 daily
    story += h2('3', 'Week 1 Sprint Plan — Daily Tasks',
                'Seven days, each with a named deliverable and a “done when” test. Sunday is the weekly buffer/review day (kept every week of the project).')
    story.append(table_flowable(DAILY_W1, minwidths=[34, 70, 220, 110]))
    story.append(PageBreak())

    # 4 content
    story += h2('4', 'Content Creation Schedule',
                'Content runs from week 1 through week 8. Estimates assume ~5–6 hours of content work per day alongside development from W2 onward; total content effort ≈ 200 hours (~30% of the 8-week project).')
    story.append(table_flowable(CONTENT_ROWS, minwidths=[150, 30, 55, 48, 110]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Weekly content load')
    story.append(table_flowable(CONTENT_WEEKLY, minwidths=[40, 380]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Content quality gates (from Step 2 checklists)')
    for p in [
        'Prompt packs: every prompt passes the value test; tested on ChatGPT, Claude, and Gemini; README with limitations; changelog for updates.',
        'Ebooks: 36–52 pages; TOC with page numbers (hyperlinked in EPUB); cover page; every page actionable; two-pass proofread.',
        'Formats: packs Word+PDF; ebooks PDF+EPUB (EPUB device-tested on Kindle, Kobo, Apple Books); bundles ZIP with README + license.',
        'Lead magnets: same quality standard as paid products — they are the store’s proof of quality.',
    ]:
        story.append(Paragraph(f'•  {p}', st('bp2', fontSize=9.2, leading=13, spaceAfter=5, leftIndent=10)))
    story.append(PageBreak())

    # 5 testing
    story += h2('5', 'Testing Plan',
                'Weekly smoke tests plus a structured end-to-end regime in W8 — including real mobile money purchases for all three product types, payment failures, and format switching.')
    story += h3('Weekly testing checkpoints')
    story.append(table_flowable([
        ['Week', 'Checkpoint'],
        ['W1', 'Deploy pipeline green; auth flow; storage upload; schema seed.'],
        ['W2', 'Type-tab filtering; ebook format toggle; sample previews load.'],
        ['W3', 'Cart add/change/remove with formats; checkout step 1 validation; order rows created.'],
        ['W4', 'Sandbox MoMo purchase completes; webhook signature + idempotency tests.'],
        ['W5', 'Signed URL expiry (short TTL); format switch; ZIP build + extract.'],
        ['W6', 'Admin CRUD round-trip; bundle builder; refund blocks downloads.'],
        ['W7', 'All 23 products render; samples download; ZIPs extract; mobile pass begins.'],
        ['W8', 'Full E2E matrix (below) + failure drills + device matrix.'],
    ], minwidths=[36, 380]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('End-to-end purchase tests (real money, W8)')
    story.append(table_flowable(E2E_ROWS, minwidths=[30, 250, 90, 100]))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(inline('Budget ≈ GH₵ 600 for real test purchases (GH₵ 75 + 185 + 319 + guest test). Refund them through the admin flow after sign-off — which also exercises the refund path. Use your own MTN and Telecel numbers; expect 2–3 days for network scheduling and settlement.'), S['body']))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Payment failure tests')
    story.append(table_flowable(FAIL_ROWS, minwidths=[110, 130, 180]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Delivery & format tests')
    story.append(table_flowable(DELIVERY_ROWS, minwidths=[90, 330]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Device / network matrix')
    story.append(table_flowable(DEVICE_ROWS, minwidths=[130, 290]))
    story.append(PageBreak())

    # 6 launch checklist
    story += h2('6', 'Launch Readiness Checklist',
                'Sign-off items for the final week. Every box must be true before the store takes its first real order.')
    for group, items in CHECKLIST:
        story += h3(group)
        for it in items:
            story.append(Paragraph(f'<font color="#12B886" size="9">✔</font>&nbsp;&nbsp;{inline(it)}', S['check']))
        story.append(Spacer(1, 0.15*cm))
    story.append(PageBreak())

    # 7 risks
    story += h2('7', 'Risks & Buffers',
                'The plan builds slack where solo-developer reality bites hardest.')
    story.append(table_flowable(RISKS, minwidths=[110, 55, 55, 200]))
    story.append(Spacer(1, 0.2*cm))
    story += h3('Where the buffers live')
    for p in [
        'Sunday review day every week (≈8 buffer days across the project).',
        'Week 7 formatting budget includes 1.5× on ebook formatting specifically.',
        'Weeks 4–5 each reserve 2 extra days for gateway/webhook surprises.',
        'W8 real-money testing is scheduled for 3 days, not 1.',
        'Scope fallback: a 3-category launch (freelance, marketing, creators) is a pre-agreed MVP cut if content slips.',
    ]:
        story.append(Paragraph(f'•  {p}', st('bp3', fontSize=9.2, leading=13, spaceAfter=5, leftIndent=10)))

    doc = Doc(OUT, meta)
    doc.multiBuild(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_meta=meta, **k))
    print('Built', OUT)

if __name__ == '__main__':
    main()
