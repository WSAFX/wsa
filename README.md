# Wallstreet Forex Academy

Website, admin dashboard and API for Wallstreet Forex Academy (Enugu, Nigeria).

## Architecture

Three independently deployable apps (one Vercel project each):

| Folder      | What it is                                   | Local port | Stack |
|-------------|----------------------------------------------|-----------|-------|
| `backend/`  | API: public reads, admin writes, media signing, AI proxy | 4000 | Express + TypeScript, Neon Postgres, Cloudinary |
| `users/`    | Public website                               | 3000      | Vite + React 19, Tailwind, Framer Motion, React Router |
| `admin/`    | Admin dashboard                              | 3001      | Next.js 14, Tiptap editor |
| `database/` | `schema.sql` (tables, seeds; idempotent)     | –         | Postgres |

**Data flow:** the admin signs in against the backend and receives a JWT. Every admin action goes
through the backend, which talks to Neon and signs Cloudinary uploads (the browser uploads files
straight to Cloudinary; the API secret never leaves the server). The public site reads from the
backend's `/api/public/*` endpoints. The WallBot assistant and market news are proxied by the
backend, so the OpenRouter and NewsAPI keys never reach the browser.

## Features

- **Announcements:** build a pop-up (title, rich-text body, optional image, button) with a live
  desktop/mobile preview. While live, it opens on every page load until the admin turns it off.
  Only one can be live at a time; optional start/end schedule.
- **Gallery with auto-framing:** bulk upload, categories, drag-to-reorder. Photos are framed with
  Cloudinary URL transforms: *smart fill* (`c_fill,g_auto`, an AI crop around the people) or *fit*
  (`c_pad,b_auto`, the whole photo with padding). The admin chooses the frame shape, frame style
  (rounded, polaroid, gold, shadow), layout (grid or masonry) and number of columns, and can
  override framing per photo.
- **Batches:** create a batch, set a featured image, bulk-upload class photos and choose how it is
  displayed: slider, featured + thumbnails, grid or masonry. Batches marked “Show on home page”
  appear in the Outgoing Batch section; every batch also has its own page under `/batches`.
- **Courses:** add, edit, reorder, highlight and hide programs. “Enroll” opens WhatsApp with the course
  name pre-filled unless a custom link is set. WallBot quotes the live course list.
- **Testimonials = Google reviews:** in **Admin → Google Reviews** paste a Google Maps Platform API key
  (Places API (New) enabled) and search for the business to save its Place ID. The backend pulls the
  reviews (Google returns up to 5 per request), refreshes them daily and shows them with Google
  attribution, a rating summary and “Write a review”. Admins can pin or hide reviews and set a minimum
  star rating. The section stays hidden until reviews exist.
- **WhatsApp widget:** floating chat button with a greeting and a pre-filled message, configured
  (and switched on or off) in **Business & SEO**.
- **Pip calculator** (`/pip-calculator`, plus a home-page section): pip value, risk-based position size
  and profit/loss for the 50 most traded pairs, USD/NGN, gold and silver, in 10 account currencies,
  using live exchange rates (`/api/public/rates`, cached hourly) with manual and broker overrides.
- **Blog:** articles and categories with a rich-text editor and SEO fields; public pages at `/blog`.
- **Site content:** hero copy, About section and team, logo, contact details, business hours and social links.

## 1. Database (Neon)

```bash
cd backend
npm install
npm run db:migrate          # applies database/schema.sql (safe to re-run)
npm run seed:admin you@example.com "a-strong-password"
```

## 2. Environment variables

Copy each `.env.example`. Never commit `.env` files; the root `.gitignore` blocks them.

| App | Local file | Needed in production |
|-----|-----------|----------------------|
| backend | `backend/.env` | `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` (`wsa`), `ADMIN_JWT_SECRET`, `CRON_SECRET`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `NEWS_API_KEY`; optional `GOOGLE_PLACES_API_KEY` |
| users | `users/.env.development` | nothing: production builds call `https://api.wsfxacademy.com` |
| admin | `admin/.env.development.local` | nothing: production builds call `https://api.wsfxacademy.com` |

In production the backend defaults `SITE_URL` to `https://wsfxacademy.com` and `ALLOWED_ORIGINS` to
`https://wsfxacademy.com,https://www.wsfxacademy.com,https://admin.wsfxacademy.com`; set them only to override.
If `OPENROUTER_API_KEY` is missing, WallBot falls back to built-in demo answers.

## 3. Run locally

```bash
# three terminals
cd backend && npm run dev     # http://localhost:4000
cd users   && npm run dev     # http://localhost:3000
cd admin   && npm run dev     # http://localhost:3001
```

## 4. Deploy (Vercel) to the live domains

| Domain | Vercel project root | Framework preset |
|--------|---------------------|------------------|
| `wsfxacademy.com` (`www` redirects to it) | `users` | Vite |
| `admin.wsfxacademy.com` | `admin` | Next.js |
| `api.wsfxacademy.com` | `backend` | Other (uses `backend/vercel.json`: Express function + daily review-sync cron) |

1. Push the repo to GitHub and import it into Vercel three times, once per root directory above.
2. Add the backend environment variables from section 2 to the **backend** project only.
3. In each project, go to **Settings → Domains** and add its domain. For `wsfxacademy.com`, also add
   `www.wsfxacademy.com` and set it to redirect to `wsfxacademy.com`.
4. At your domain registrar, create the DNS records Vercel shows for each domain. Typically:
   - `A` record, host `@` → `76.76.21.21`
   - `CNAME` record, host `www` → `cname.vercel-dns.com`
   - `CNAME` record, host `admin` → `cname.vercel-dns.com`
   - `CNAME` record, host `api` → `cname.vercel-dns.com`
5. Check that `https://api.wsfxacademy.com/api/health` returns `{"status":"ok"}`, then sign in at
   `https://admin.wsfxacademy.com`.

Notes:
- `users/vercel.json` serves `/sitemap.xml` from the API (live blog posts and batches) and sends every
  other path to the single-page app. `users/public/robots.txt` points search engines at the sitemap.
- The daily Google reviews sync runs from Vercel Cron when `CRON_SECRET` is set on the backend project.
- After launch, add `https://wsfxacademy.com` to Google Search Console and submit the sitemap.