# Cudjoe Digital Studio — Digital Product Marketplace

A production-ready digital marketplace for **AI prompt packs, practical ebooks and bundles** — built for mobile-first buyers in Ghana and West Africa. Pay with **MTN Mobile Money or Telecel Cash**, get **instant multi-format downloads** (Word, PDF, EPUB, ZIP) via **signed, expiring links**, with user accounts, purchase history, format switching and a full admin dashboard.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind**, runnable entirely on **free tiers** (Vercel Hobby, Supabase free tier optional), with a built-in **demo payment gateway** so the whole flow works before you add real payment keys.

---

## ✨ Features

| Area | What's included |
|---|---|
| **Storefront** | Home · Shop with type tabs (Prompts / Ebooks / Bundles) + category filter + search + sort · type-specific product pages (prompt count + sample preview · cover + TOC + author + PDF/EPUB toggle · itemized bundle + savings) · lead magnets |
| **Cart & checkout** | 2-step mobile checkout · per-item format selection · MTN MoMo + Telecel Cash with Ghana phone validation · payment success/failure pages · demo gateway for testing |
| **Payments** | Paystack (Ghana) mobile-money integration with **HMAC-verified webhook** (`charge.success`) · Flutterwave fallback hook · idempotent fulfillment · pending→paid→refunded states |
| **Delivery** | Instant unlock on payment · **HMAC-signed download URLs expiring after 48 h** (configurable) · PDF/DOCX/EPUB/ZIP with correct MIME types · **Range-request resume** · format switching forever · bundle **ZIPs pre-built** at publish time |
| **Accounts** | Signup/login (password hashed with scrypt) · purchase history · re-downloads · format switching · guest checkout with email lookup |
| **Admin** | Sales overview (revenue, by product type, last 14 days, top products) · product CRUD for prompts & ebooks · bundle builder with auto savings + ZIP build · order search + status · seeded admin account |
| **SEO** | Metadata per page · Open Graph · sitemap.xml · robots.txt · structured content · favicon |
| **Static** | About · FAQ · Contact · Terms · Privacy · Refunds · Delivery |

---

## 🚀 Quick start (local)

```bash
npm install
cp .env.example .env.local          # default = demo gateway, no keys needed
node scripts/seed.mjs               # creates admin + demo buyer accounts
npm run build                       # optional — or just:
npm run dev                         # http://localhost:3000
```

**Demo accounts (password shown below):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cudjoe.digital` | `admin123` |
| Buyer | `buyer@example.com` | `buyer123` |

**Try the full flow without real money:** add a product → checkout → choose MTN MoMo → on the pay screen tap **“Approve payment”** (this simulates approving the phone prompt) → downloads unlock instantly.

---

## 🗂 Repository layout

```
app/                    # Next.js App Router — pages + API routes
  shop/                 #   storefront: home, shop, product pages, free
  checkout/ cart/       #   cart + 2-step checkout + success/failure
  account/              #   dashboard, downloads, purchase history
  admin/                #   dashboard, products, bundles, orders
  api/                  #   products, cart, checkout, payments, webhooks,
                        #   downloads, auth, admin/*, lead-magnets
components/             # UI components (client islands)
content/                # bundles.json (bundle composition)
lib/                    # types, store, catalog, auth, cart, payments,
                        #   delivery (signed URLs), email, zip
scripts/                # content generation + seeding
storage/                # product files (packs, ebooks, covers, bundles)
market-research/        # planning docs (Steps 1–6 PDFs)
```

**Product content** is real: 11 prompt packs (Word + PDF), 4 ebooks (PDF + EPUB + covers), 3 bundle ZIPs, and 2 lead magnets. Regenerate with:

```bash
python3 scripts/generate_content.py   # rebuilds all product files
node scripts/seed.mjs                 # reseed users
```

---

## 💳 Going live with real mobile money (Paystack)

1. Create a **Paystack account for Ghana** (business verification required for live mobile money) at [paystack.com](https://paystack.com).
2. Set env vars on Vercel: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `APP_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`.
3. In the Paystack dashboard → Settings → Webhooks, set the URL to:
   `https://<your-app>.vercel.app/api/webhooks/paystack`
   (event: `charge.success`). The route verifies the `x-paystack-signature` HMAC and is idempotent.
4. Deploy, then run one **real test purchase per product type** (prompt via MoMo, ebook via Telecel, bundle via MoMo) and refund them via the gateway.
5. Optional: set `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_SECRET` and `PAYMENT_GATEWAY=flutterwave` for a second gateway.

> With `PAYSTACK_SECRET_KEY` set, checkout calls `POST /transaction/initialize` (GHS, `mobile_money`), the buyer approves on their phone, and the webhook unlocks downloads — no demo buttons.

---

## 🔐 Security notes

- Download links are **HMAC-SHA256 signed** (`APP_SECRET`) with an expiry embedded in the token (default 48 h, env `DOWNLOAD_LINK_TTL_SECONDS`).
- Downloads are validated against the **order**, the **buyer**, the **paid status** and the **format**; refunded orders are revoked (403).
- Passwords hashed with **scrypt + per-user salt**; session cookies are HTTP-only, signed, SameSite=Lax.
- Admin API routes enforce the `admin` role claim.
- Product files are **never served statically** — only via `/api/downloads/[token]` or the whitelisted `/api/files` (covers/samples only).

## 🧪 Test matrix (all verified)

`cds` — the following pass in CI-less smoke tests: type-tab filtering · add-to-cart with format · checkout validation (MTN 024/054/055/059, Telecel 020/026/027/050) · demo approve → paid → email logged · PDF/Word/EPUB/ZIP downloads with correct MIME · format switching · bundle ZIP extraction · lead magnet capture · admin analytics · tampered-token rejection (410) · unpaid-order block (403) · Range/resume (206).

---

## 🧰 Tech stack (all free tiers)

- **Next.js 14** on **Vercel Hobby** (1M invocations/mo, 100 GB transfer)
- **Tailwind CSS** — mobile-first UI
- File-backed demo DB (`.data/db.json`) → swap for **Supabase** (Postgres + Auth + Storage) at scale (schema in `market-research/step-5-…pdf`; adapter hook: `lib/store.ts`)
- **Paystack** (Ghana) primary gateway · **Flutterwave** fallback
- **Resend** for transactional email (3 000/mo free) · SMS via Termii/Arkesal (post-launch)
- ZIPs via `fflate` (pure JS)

## 📄 License & content

Code: MIT. Product content (prompts, ebooks): © 2026 Cudjoe Digital Studio — personal, non-transferable licence per purchase; not for resale or redistribution.

---

*Planning docs for every step of this build live in [`market-research/`](market-research/): research (Step 1), catalog & pricing (Step 2), architecture (Step 3), user flows & wireframes (Step 4), tech stack & payments (Step 5), and the build roadmap (Step 6).*
