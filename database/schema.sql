-- =====================================================================
-- Wallstreet Forex Academy: Neon Postgres Schema
-- Run with `npm run db:migrate` (backend) or paste into the Neon SQL Editor.
-- Idempotent: safe to re-run.
-- =====================================================================

-- Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";

-- Helper: auto-update updated_at -------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- profiles: admin user credentials and role
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  role          text not null default 'admin' check (role in ('admin')),
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- site_settings: singleton row (id = 1), brand + business + SEO
-- =====================================================================
create table if not exists public.site_settings (
  id                  int primary key default 1 check (id = 1),
  business_name       text not null default 'Wallstreet Forex Academy',
  tagline             text default 'Master the Art of Forex Trading',
  logo_url            text,
  logo_public_id      text,
  primary_color       text not null default '#2563EB',
  secondary_color     text not null default '#FFFFFF',
  default_hero_color  text not null default '#1E3A8A',
  phone               text default '+234 814 083 3872',
  whatsapp            text default '+234 814 083 3872',
  email               text default 'info@wallstreetforexacademy.com',
  address             text default 'Opposite Uwani Police Station, 50 Zik Ave, Uwani, Enugu 400242',
  city                text default 'Enugu',
  state               text default 'Enugu State',
  country             text default 'Nigeria',
  lat                 double precision,
  lng                 double precision,
  google_maps_url     text default 'https://maps.app.goo.gl/GHPvWzUdAznhGMnC6',
  facebook_url        text default 'https://www.facebook.com/people/Wallstreet-Forex-Academy-Enugu',
  instagram_url       text default 'https://www.instagram.com/wallstreetforex_academy_enugu/',
  youtube_url         text default 'https://www.youtube.com/@wallstreetforexacademy',
  tiktok_url          text default 'https://www.tiktok.com/@wallstreet_forex_enugu',
  linkedin_url        text default 'https://linkedin.com/company/wallstreet-forex-academy',
  default_meta_title  text default 'Wallstreet Forex Academy: Learn Forex Trading in Enugu, Nigeria',
  default_meta_description text default 'Wallstreet Forex Academy trains beginner to professional forex traders in Enugu, Nigeria. Expert-led courses, live trading sessions and 1-on-1 mentorship.',
  copyright_text      text default '',
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- hero_settings: singleton row (id = 1), admin-editable hero copy
-- =====================================================================
create table if not exists public.hero_settings (
  id                  int primary key default 1 check (id = 1),
  badge_text          text default 'Nigeria''s Premier Forex Academy',
  heading             text not null default 'Master the Art of Forex Trading',
  heading_highlight   text default 'Art of Forex',
  subheading          text not null default 'Join thousands of successful traders trained at Wallstreet Forex Academy. Learn from experts with over 15 years of market experience.',
  cta_label           text default 'Start Learning',
  cta_href            text default '#courses',
  secondary_cta_label text default 'Learn More',
  secondary_cta_href  text default '#about',
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_hero_updated on public.hero_settings;
create trigger trg_hero_updated before update on public.hero_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- about_content: singleton row (id = 1)
-- team: [{ name, role, image_url, description }]
-- =====================================================================
create table if not exists public.about_content (
  id              int primary key default 1 check (id = 1),
  headline        text not null default 'Transform Your Financial Future with Expert Guidance',
  subheading      text default 'Wallstreet Forex Academy is Nigeria''s leading forex education institution.',
  body_html       text default '<p>Founded by <strong>Chukwuma Cornelius Chibuike</strong>, Wallstreet Forex Academy has been at the forefront of forex education in Nigeria since 2009.</p><p>We''ve trained over 5,000 students, with our graduates collectively achieving over ₦2 billion in trading profits.</p>',
  image_url       text,
  image_public_id text,
  stats           jsonb not null default '[{"label": "Students Trained", "value": "5,000+"}, {"label": "Years Experience", "value": "15+"}, {"label": "Student Profits", "value": "₦2B+"}, {"label": "Success Rate", "value": "95%"}]'::jsonb,
  team            jsonb not null default '[{"name": "Chukwuma Cornelius Chibuike", "role": "Chief Executive Officer & Lead Instructor", "image_url": null, "description": "With over 15 years of forex trading experience, Cornelius founded Wallstreet Forex Academy to share his expertise with aspiring traders across Nigeria."}, {"name": "Chukwuma Kamsi Cynthia", "role": "Secretary & Operations Director", "image_url": null, "description": "Cynthia ensures smooth operations and exceptional student experiences at the academy."}]'::jsonb,
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_about_updated on public.about_content;
create trigger trg_about_updated before update on public.about_content
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Blog: categories + articles
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  excerpt           text default '',
  content_html      text default '',
  cover_image_url   text,
  cover_public_id   text,
  meta_title        text default '',
  meta_description  text default '',
  keywords          text[] not null default '{}',
  status            text not null default 'draft' check (status in ('draft', 'published')),
  featured          boolean not null default false,
  author            text default 'Wallstreet Forex Academy',
  reading_minutes   int not null default 3,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_articles_status on public.articles (status);
create index if not exists idx_articles_published_at on public.articles (published_at desc);

drop trigger if exists trg_articles_updated on public.articles;
create trigger trg_articles_updated before update on public.articles
  for each row execute function public.set_updated_at();

create table if not exists public.article_categories (
  article_id  uuid references public.articles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (article_id, category_id)
);

-- =====================================================================
-- Gallery
-- Auto-framing is applied at render time via Cloudinary URL transforms
-- (c_fill,g_auto = AI subject-aware crop; c_pad,b_auto = fit + auto padding).
-- Per-image crop_mode / gravity / frame_style override gallery_settings when set.
-- =====================================================================
create table if not exists public.gallery_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  public_id   text,
  width       int,
  height      int,
  caption     text default '',
  alt         text default '',
  category_id uuid references public.gallery_categories(id) on delete set null,
  crop_mode   text check (crop_mode in ('fill', 'pad')),
  gravity     text not null default 'auto' check (gravity in ('auto', 'face', 'faces', 'center')),
  frame_style text check (frame_style in ('none', 'rounded', 'polaroid', 'gold', 'shadow')),
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_gallery_images_order on public.gallery_images (sort_order);
create index if not exists idx_gallery_images_category on public.gallery_images (category_id);

create table if not exists public.gallery_settings (
  id            int primary key default 1 check (id = 1),
  aspect_ratio  text not null default '4:3' check (aspect_ratio in ('1:1', '4:3', '3:4', '3:2', '16:9')),
  crop_mode     text not null default 'fill' check (crop_mode in ('fill', 'pad')),
  frame_style   text not null default 'rounded' check (frame_style in ('none', 'rounded', 'polaroid', 'gold', 'shadow')),
  layout        text not null default 'grid' check (layout in ('grid', 'masonry')),
  columns       int not null default 3 check (columns between 2 and 5),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_gallery_settings_updated on public.gallery_settings;
create trigger trg_gallery_settings_updated before update on public.gallery_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Announcements: shown as a modal on every site load while active.
-- At most one active announcement (enforced by the partial unique index).
-- =====================================================================
create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body_html       text default '',
  image_url       text,
  image_public_id text,
  layout          text not null default 'image_top' check (layout in ('image_top', 'image_left', 'image_background')),
  cta_label       text default '',
  cta_href        text default '',
  is_active       boolean not null default false,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists uq_announcements_one_active
  on public.announcements ((true)) where is_active;

drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Batches: each class/cohort, with a featured image + photo set.
-- display_mode is chosen by the admin per batch.
-- =====================================================================
create table if not exists public.batches (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  description         text default '',
  start_date          date,
  graduation_date     date,
  featured_image_url  text,
  featured_public_id  text,
  status              text not null default 'current' check (status in ('current', 'outgoing', 'archived')),
  display_mode        text not null default 'slider' check (display_mode in ('slider', 'featured_thumbs', 'grid', 'masonry')),
  show_on_home        boolean not null default false,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_batches_status on public.batches (status);

drop trigger if exists trg_batches_updated on public.batches;
create trigger trg_batches_updated before update on public.batches
  for each row execute function public.set_updated_at();

create table if not exists public.batch_images (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references public.batches(id) on delete cascade,
  image_url   text not null,
  public_id   text,
  width       int,
  height      int,
  caption     text default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_batch_images_batch on public.batch_images (batch_id, sort_order);

-- =====================================================================
-- Seed singleton rows
-- =====================================================================
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
insert into public.hero_settings (id) values (1) on conflict (id) do nothing;
insert into public.about_content (id) values (1) on conflict (id) do nothing;
insert into public.gallery_settings (id) values (1) on conflict (id) do nothing;

-- Seed gallery categories (matches the original static site)
insert into public.gallery_categories (name, slug, sort_order) values
  ('Classroom', 'classroom', 0),
  ('Events', 'events', 1),
  ('Graduation', 'graduation', 2),
  ('Workshops', 'workshop', 3)
on conflict (slug) do nothing;

-- Seed the existing Cloudinary gallery photos once (only when the gallery is empty)
insert into public.gallery_images (image_url, public_id, caption, alt, category_id, sort_order)
select v.image_url, v.public_id, v.caption, v.caption, c.id, v.sort_order
from (values
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972429/image14_kde24l.jpg', 'image14_kde24l', 'Live Trading Session - Students analyzing EUR/USD', 'classroom', 0),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972428/image3_bdpwuw.jpg', 'image3_bdpwuw', 'Graduation Ceremony - Class of Excellence', 'graduation', 1),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972429/WhatsApp_Image_2025-10-27_at_7.50.28_cq8f5m.jpg', 'WhatsApp_Image_2025-10-27_at_7.50.28_cq8f5m', 'Advanced Technical Analysis Workshop', 'workshop', 2),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972427/image11_crfjic.jpg', 'image11_crfjic', 'Team Building & Strategy Session', 'events', 3),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972429/WhatsApp_Image_2025-10-27_at_7.50.28_AM_kafkoo.jpg', 'WhatsApp_Image_2025-10-27_at_7.50.28_AM_kafkoo', 'One-on-One Mentorship Program', 'classroom', 4),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972427/image9_hpwtuq.jpg', 'image9_hpwtuq', 'Student Success Celebration', 'graduation', 5),
  ('https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972429/image2_r7pzta.jpg', 'image2_r7pzta', 'Fundamental Analysis Deep Dive', 'classroom', 6)
) as v(image_url, public_id, caption, category_slug, sort_order)
left join public.gallery_categories c on c.slug = v.category_slug
where not exists (select 1 from public.gallery_images);

-- =====================================================================
-- Business hours (shown in the contact section)
-- =====================================================================
alter table public.site_settings add column if not exists business_hours text default 'Mon - Sat: 9AM - 6PM';

-- =====================================================================
-- Courses (admin-managed; the "Enroll" button opens WhatsApp unless cta_href is set)
-- =====================================================================
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text default '',
  duration      text default '',
  level         text not null default 'Beginner' check (level in ('Beginner', 'Intermediate', 'Advanced')),
  price         text default '',
  features      text[] not null default '{}',
  highlighted   boolean not null default false,
  badge_text    text default 'Most Popular',
  cta_label     text default 'Enroll Now',
  cta_href      text default '',
  sort_order    int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_courses_order on public.courses (sort_order);

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();

-- Seed the original three programs once (only when the table is empty)
insert into public.courses (title, description, duration, level, price, features, highlighted, sort_order)
select v.title, v.description, v.duration, v.level, v.price, v.features, v.highlighted, v.sort_order
from (values
  ('Forex Fundamentals', 'Master the basics of forex trading, currency pairs, and market mechanics.', '8 Weeks', 'Beginner', '₦150,000',
    array['Understanding currency pairs', 'Market hours & sessions', 'Basic technical analysis', 'Demo trading practice', 'Certificate upon completion'], false, 0),
  ('Technical Analysis Mastery', 'Deep dive into chart patterns, indicators, and price action strategies.', '8 Weeks', 'Intermediate', '₦300,000',
    array['Advanced chart patterns', 'Multiple indicator strategies', 'Price action trading', 'Fibonacci & Elliott Wave', 'Live trading sessions'], false, 1),
  ('Professional Trading Program', 'Comprehensive program for serious traders aiming for consistency.', '8 Weeks', 'Advanced', '₦500,000',
    array['Complete trading system', 'Risk management mastery', 'Trading psychology', 'Portfolio management', '1-on-1 mentorship', 'Funded account opportunity', 'Access to exclusive webinars', 'Access to private trading community'], true, 2)
) as v(title, description, duration, level, price, features, highlighted, sort_order)
where not exists (select 1 from public.courses);

-- =====================================================================
-- Google reviews (testimonials), pulled from Google Places API (New)
-- api_key is write-only from the admin (never returned to any client);
-- GOOGLE_PLACES_API_KEY in the backend env is used when it is empty.
-- =====================================================================
create table if not exists public.google_reviews_settings (
  id              int primary key default 1 check (id = 1),
  api_key         text,
  place_id        text,
  place_name      text,
  place_address   text,
  maps_uri        text,
  rating          numeric,
  total_reviews   int,
  min_rating      int not null default 4 check (min_rating between 1 and 5),
  keep_history    boolean not null default false,
  last_synced_at  timestamptz,
  last_error      text,
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_google_reviews_settings_updated on public.google_reviews_settings;
create trigger trg_google_reviews_settings_updated before update on public.google_reviews_settings
  for each row execute function public.set_updated_at();

insert into public.google_reviews_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.google_reviews (
  id                uuid primary key default gen_random_uuid(),
  review_name       text not null unique,
  author_name       text not null,
  author_uri        text,
  author_photo_uri  text,
  rating            int not null,
  text              text default '',
  language_code     text,
  publish_time      timestamptz,
  relative_time     text,
  review_uri        text,
  hidden            boolean not null default false,
  pinned            boolean not null default false,
  in_latest_fetch   boolean not null default true,
  first_seen_at     timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_google_reviews_publish on public.google_reviews (publish_time desc);

-- =====================================================================
-- WhatsApp chat widget (number comes from site_settings.whatsapp)
-- =====================================================================
alter table public.site_settings add column if not exists whatsapp_widget_enabled boolean not null default true;
alter table public.site_settings add column if not exists whatsapp_greeting text default 'Hi there 👋 Have a question about our forex programs? Chat with us on WhatsApp.';
alter table public.site_settings add column if not exists whatsapp_message text default 'Hello Wallstreet Forex Academy, I would like to know more about your courses.';
