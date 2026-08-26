-- ============================================================
-- Production schema for the digital marketplace (Supabase/Postgres)
-- Apply in the Supabase SQL editor. RLS policies: see notes per table.
-- ============================================================

-- Users are managed by Supabase Auth (auth.users).
-- public.profiles links auth users to store data.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
-- RLS: users can read/update their own profile; admins read all.

-- products: one row per sellable item; product_type drives the
-- page template, fields and fulfillment logic.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,                    -- PKG-FRE-01, EBK-MKT-01, BND-...
  title text not null,
  description text not null,
  product_type text not null check (product_type in ('prompt','ebook','bundle')),
  category text not null,                      -- freelance | marketing | smb | creators | dev
  price_ghs numeric(10,2) not null,
  -- type-specific fields (null where not applicable)
  prompt_count int,
  page_count int,
  author text,
  cover_path text,                             -- storage path (public bucket)
  sample_path text,                            -- free chapter / sample prompts
  toc jsonb,                                   -- ebook TOC (ordered list)
  formats text[] not null default '{}',        -- format_options: {'pdf','docx'} | {'pdf','epub'} | {'zip'}
  file_paths jsonb not null default '{}',      -- {pdf: 'product-files/ebooks/ebk-01.pdf', ...}
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz default now()
);
alter table public.products enable row level security;
-- RLS: public read where active=true; admin writes.

-- bundle_items: which products belong to which bundle.
create table public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.products(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position int not null default 0,
  unique (bundle_id, product_id)
);
alter table public.bundle_items enable row level security;

create table public.orders (
  id text primary key,                         -- CDS-XXXX
  user_id uuid references auth.users(id) on delete set null,  -- null for guests
  email text not null,
  phone text,
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','failed','refunded')),
  total_ghs numeric(10,2) not null,
  currency text not null default 'GHS',
  items jsonb not null default '[]',           -- [{productId,title,productType,format,priceGhs}]
  payment_method text not null check (payment_method in ('mtn_momo','telecel_cash')),
  created_at timestamptz default now()
);
alter table public.orders enable row level security;
-- RLS: owner (user_id = auth.uid()) or email match for guests; admin reads all.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('paystack','flutterwave')),
  channel text not null check (channel in ('mtn_momo','telecel_cash','airteltigo','card')),
  reference text unique not null,              -- gateway reference (idempotency key)
  status text not null default 'pending'
    check (status in ('pending','authorized','paid','failed','refunded')),
  amount_ghs numeric(10,2) not null,
  raw jsonb,                                   -- full webhook payload for audit
  created_at timestamptz default now()
);
alter table public.payments enable row level security;

-- downloads: one row per (order, product, format) — enables re-download
-- and format switching with usage tracking.
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  format text not null,                        -- pdf | docx | epub | zip
  file_path text not null,                     -- storage path for this format
  download_count int not null default 0,
  last_downloaded_at timestamptz,
  created_at timestamptz default now(),
  unique (order_id, product_id, format)
);
alter table public.downloads enable row level security;

-- lead magnet subscribers
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  source text not null default 'lead-magnet',
  created_at timestamptz default now()
);

-- indexes for hot queries
create index idx_products_type_active on public.products(product_type, active);
create index idx_orders_email on public.orders(email);
create index idx_payments_reference on public.payments(reference);
create index idx_downloads_order on public.downloads(order_id);

-- ============================================================
-- Supabase Storage layout (buckets):
--   product-files  (PRIVATE — server-only via service role)
--     prompts/{id}/pack.pdf|docx · ebooks/{id}/book.pdf|epub · bundles/{id}/bundle.zip
--   samples  (PUBLIC — free chapters, sample prompts)
--   covers   (PUBLIC — cover images 600x900)
-- Signed URLs: storage.createSignedUrl(path, 172800) for 48h expiry.
-- ============================================================
