# Step 7 — Go-Live Guide: Deploy, Real Mobile Money & CI

**How to take the marketplace live.** Three parts: (1) deploy to Vercel, (2) turn on real MTN MoMo + Telecel Cash payments with Paystack, (3) enable the CI pipeline. Everything else is already built and verified.

**What you need before starting (create these — free):**
- A **Vercel** account (sign up with your GitHub account — 1 click)
- A **Paystack** account for **Ghana** (requires your business/bank details; verification takes 1–3 business days, so start this first)
- Your normal **GitHub** access (for the CI step)

> ⚠️ **Important before you go live:** the app ships with a *demo database* (`.data/db.json`). On Vercel's serverless filesystem, writes don't persist between requests — so for real sales you must switch to the **Supabase adapter** (Section 4). Until then, treat any deployed instance as a demo (purchases work end-to-end, but orders reset on cold starts).

---

## 1 · Deploy to Vercel (~15 minutes)

1. **Create your Vercel account** — go to https://vercel.com → **Sign Up** → **Continue with GitHub** → authorize Vercel for the `Obed-Cudjoe` account (you can grant access to "Only select repositories" → choose `my-personal-website`).
2. **Import the project** — after signup you land on **Overview → Add New… → Project**. Find `my-personal-website` in the list and click **Import**. (If the app code isn't on your default branch yet, do this first: in GitHub, open a pull request from `arena/01a03b32-my-personal-website` → `main`, merge it, then import. Vercel deploys `main` by default; you can also select a branch during import.)
3. **Framework preset** — Vercel auto-detects **Next.js**. Leave everything at default:
   - Build Command: `npm run build` · Output Directory: (empty/.next) · Root: `./`
4. **Environment variables** — click **Environment Variables** and add:

   | Key | Value | Notes |
   |---|---|---|
   | `APP_SECRET` | `openssl rand -hex 32` output (or any 32+ char random string) | Signs sessions, carts, download tokens. Never share. |
   | `NEXT_PUBLIC_SITE_URL` | your future URL, e.g. `https://my-personal-website.vercel.app` | Used for email links + sitemap; update after first deploy |
   | `DOWNLOAD_LINK_TTL_SECONDS` | `172800` | Optional; 48 h default |
   | `RESEND_API_KEY` | *(optional)* | Real transactional email; without it, emails are logged instead of sent |

   **Do NOT add Paystack keys yet** — that's Section 2.
5. **Deploy** — click **Deploy**. First build takes ~2–3 minutes. When it finishes you get a URL like `https://my-personal-website-xxxx.vercel.app`.
6. **Smoke test the demo flow on the live URL:**
   - Open the site on your phone → **Shop** → open any prompt pack → **Add to cart** → **Checkout**
   - Enter email + your phone number → **MTN Mobile Money** → **Continue**
   - On the pay screen tap **✓ Approve payment** (demo gateway simulates the MoMo prompt) → downloads unlock → files download.
   - Log in as admin (`admin@cudjoe.digital` / `admin123`) → **Admin** → see revenue analytics.
7. **Set the real domain** — go to **Settings → Environment Variables** → edit `NEXT_PUBLIC_SITE_URL` to your final URL → **Redeploy** (Settings → Deployments → ⋯ → Redeploy). Optional: **Settings → Domains** → add a custom domain (e.g. `store.cudjoe.digital`).

> Demo-mode caveat: with no Paystack key, the "Approve payment" button simulates the phone prompt. Real money mode (next section) replaces it with the actual MTN MoMo / Telecel Cash prompt.

---

## 2 · Real mobile money: Paystack (Ghana) — ~1 hour + verification wait

The app already contains the full Paystack integration (initialize → webhook → unlock). You only supply the keys and the webhook URL.

### 2a · Create & verify your Paystack account
1. Go to https://paystack.com → **Create free account** → choose **Ghana** as your country.
2. Complete **business settings**: business name, registration details, address, **bank account for settlements** (T+1 payout), phone.
3. Complete **KYC/verification**: Paystack asks for business registration + director ID. This takes **1–3 business days** — start it now; everything else in this guide can proceed in parallel.
4. When verified, open **Settings → API Keys & Webhooks** and copy:
   - **Secret Key** (`sk_live_…`)
   - **Public Key** (`pk_live_…`)

### 2b · Set the keys on Vercel
1. Vercel → your project → **Settings → Environment Variables** → add (for **Production**):
   - `PAYSTACK_SECRET_KEY` = `sk_live_…`
   - `PAYSTACK_PUBLIC_KEY` = `pk_live_…`
   - *(optional)* `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_SECRET` + `PAYMENT_GATEWAY=flutterwave` for the fallback gateway.
2. **Redeploy** the app.
3. The code detects the key and switches from the demo gateway to real Paystack automatically — no code changes. (Webhook signature verification uses `PAYSTACK_SECRET_KEY`; no extra webhook secret needed.)

### 2c · Configure the webhook (this is what unlocks downloads instantly)
1. Paystack dashboard → **Settings → API Keys & Webhooks → Webhook URL** → enter:

   ```
   https://<your-app>.vercel.app/api/webhooks/paystack
   ```

2. Save. The `charge.success` event is enabled by default.
3. **Test the webhook** — same page → **Send test webhook** → check your Vercel **Functions → Logs** for the `POST /api/webhooks/paystack` request returning 200 (our handler verifies the HMAC signature, ignores unknown events, acknowledges fast, and is idempotent — duplicate deliveries can't double-fulfill).

### 2d · Real test purchases (required before launch — see Section 5)
Run **one real purchase per product type** with small amounts, from your own phone, and refund each after:

| # | Product | Payment method | What to verify |
|---|---|---|---|
| T1 | A prompt pack (GH₵ 75) | **MTN MoMo** (024/054/055/059 number) | Paystack page → approve with PIN → site confirms → **Word + PDF** download |
| T2 | An ebook (GH₵ 185) | **Telecel Cash** (020/026/027/050 number) | Approve → **EPUB** download → then switch to **PDF** in My Downloads |
| T3 | A bundle (GH₵ 319) | **MTN MoMo** | ZIP downloads, extracts to packs + ebook + README |
| T4 | Failure drill | MTN MoMo, wrong PIN / cancel | "Payment wasn't completed" page; no money leaves the account; cart preserved |
| T5 | Invalid number | Enter an 020 number with MoMo selected | Inline validation blocks checkout before payment |

**How the flow works in production:** checkout calls Paystack `POST /transaction/initialize` (GHS, `mobile_money`, restricted to MoMo or Telecel per your selection) → the buyer is redirected to Paystack's page → they enter their number and approve the **USSD/app push with their MoMo PIN** → Paystack sends `charge.success` to your webhook → the server verifies the signature, marks the order paid, and **unlocks + emails the download links** → Paystack redirects the buyer back to your pay page (`callback_url` is pre-set with the order id) → the page sees the order is paid and shows the confirmation + downloads.

### 2e · Refunds
- Gateway side: Paystack dashboard → **Transactions** → find the payment → **Refund** (back to the buyer's wallet).
- Store side: admin dashboard → **Orders** → the order keeps its state; the download route rejects refunded orders automatically (403). Keep both in sync when you refund a real order.

---

## 3 · Enable the CI workflow (~5 minutes)

The file `.github/workflows/ci.yml` exists in the project (on disk) — it runs `npm ci` → `npm run typecheck` → `npm run build` on every push/PR. It wasn't pushed because this sandbox's GitHub token lacks the `workflows` permission. Your own account can push it:

**Option A — push from your machine:**
```bash
git add .github/workflows/ci.yml
git commit -m "Enable CI: typecheck + build on push"
git push
```

**Option B — via the GitHub web UI (no local setup):**
1. Repo → **Add file → Create new file** → path `.github/workflows/ci.yml`
2. Paste this content:

```yaml
name: CI

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
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
```

3. **Commit changes** → the **Actions** tab starts a run (≈3 min). Green = CI is live.
4. *(Optional)* Repo → **Settings → Branches → Add rule** → protect `main` with "Require status checks" → pick `build` — so nothing merges broken.

---

## 4 · Production data: switch to Supabase (REQUIRED before real launch)

The built-in demo DB cannot persist orders on Vercel's serverless filesystem. For real sales:

1. **Create a free Supabase project** at https://supabase.com → **New project** (free tier: 500 MB Postgres, 50K MAU, 1 GB storage).
2. **Apply the schema** — open **SQL Editor** → paste the contents of **`db/schema.sql`** (already in your repo — products, orders, payments, downloads, bundle_items, profiles, subscribers, RLS notes, bucket layout) → **Run**.
3. **Create the buckets** — **Storage → New bucket**: `product-files` (Private) and `samples`, `covers` (Public).
4. **Upload product files** — `storage/prompts/*`, `storage/ebooks/*`, `storage/bundles/*`, `storage/samples/*`, `storage/ebooks/*/cover.jpg` into the buckets following the paths in `lib/catalogData.ts` (e.g. `prompts/pkg-fre-01/pack.pdf`). Easiest: Supabase dashboard → Storage → drag & drop, or `npx supabase storage cp`.
5. **Set env vars on Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.
6. **Swap the data layer** — the app reads/writes through `lib/store.ts` (users/orders/payments/downloads) and `lib/catalog.ts`; replace their implementations with Supabase queries (PostgREST + service-role client), keeping the same exported functions. Schema and RLS from step 2 are designed for exactly this swap. (~1–2 days of work.)
7. **Re-run the T1–T5 tests** from Section 2d against Supabase, then delete `.data/db.json`.

---

## 5 · Launch-readiness checklist

- [ ] Vercel deploy live, custom URL set, `NEXT_PUBLIC_SITE_URL` updated + redeployed
- [ ] Paystack Ghana account verified; live keys set on Vercel; webhook URL registered
- [ ] Webhook test: `charge.success` appears in Vercel function logs with HTTP 200
- [ ] T1 prompt pack via MTN MoMo — paid, Word+PDF downloaded, email received
- [ ] T2 ebook via Telecel Cash — EPUB downloaded, PDF format-switch works
- [ ] T3 bundle via MoMo — ZIP downloaded and extracted
- [ ] T4/T5 failure drills pass (declined payment page, phone validation)
- [ ] Refunds: gateway refund + admin order state sync tested
- [ ] Supabase adapter live (Section 4) — orders persist across restarts
- [ ] CI green on `main`; branch protection on (optional)
- [ ] Real email sending: `RESEND_API_KEY` set, receipt email arrives (else links are only on the confirmation page)
- [ ] Support inbox + WhatsApp set up (README footer text updated to real contacts)

---

## 6 · Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| Checkout shows the demo "Approve payment" button | `PAYSTACK_SECRET_KEY` not set on Vercel (or not redeployed after setting) → add key → Redeploy |
| Webhook returns 401 in logs | Wrong secret: our handler signs with `PAYSTACK_SECRET_KEY` — ensure the live key matches the dashboard |
| Buyer pays but no downloads | Webhook URL wrong/not saved, or `charge.success` not enabled → re-check Section 2c; order can be reconciled manually: admin → orders → (or call `GET /api/orders/[id]/verify` fallback) |
| "Invalid phone number" on a valid number | Prefix network mismatch — MTN: 024/054/055/059 · Telecel: 020/026/027/050 |
| Orders disappear after a while | Demo DB on serverless — Section 4 (Supabase) is mandatory for production |
| 410 "link invalid or expired" | Normal: links expire after 48 h — generate a fresh one from My Downloads |
| CI won't run after pushing | You pushed via a token without `workflows` permission → push `.github/workflows/ci.yml` with your own account (Section 3) |

---

*The full implementation (code, tests, content) is in the repo; this guide covers only the parts that need your accounts. If any step fails, the error page/topic in the table above will tell you which knob to turn.*
