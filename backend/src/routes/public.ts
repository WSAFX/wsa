import { Router, Request, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { chat, fetchForexNews } from '../lib/assistant';
import { syncIfStale } from '../lib/googleReviews';
import { getUsdRates } from '../lib/rates';
import { env } from '../lib/env';
import { chatLimiter } from '../middleware/rateLimit';
import { chatSchema } from '../validation/schemas';

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// GET /api/public/site-settings
router.get(
  '/site-settings',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.site_settings WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/hero
router.get(
  '/hero',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.hero_settings WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/about
router.get(
  '/about',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.about_content WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/categories
router.get(
  '/categories',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT * FROM public.categories
      ORDER BY name ASC
    `;
    res.json(rows);
  }),
);

// GET /api/public/articles?page=1&limit=9&category=slug&featured=true
router.get(
  '/articles',
  wrap(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '9'), 10)));
    const offset = (page - 1) * limit;

    const empty = { items: [], page, limit, total: 0, totalPages: 0 };
    const featuredOnly = req.query.featured === 'true';

    let categoryArticleIds: string[] | null = null;

    if (req.query.category) {
      const catRows = await sql`
        SELECT id FROM public.categories WHERE slug = ${String(req.query.category)} LIMIT 1
      `;
      if (!catRows.length) {
        res.json(empty);
        return;
      }
      const linkRows = await sql`
        SELECT article_id FROM public.article_categories WHERE category_id = ${catRows[0].id}
      `;
      categoryArticleIds = linkRows.map((r) => String(r.article_id));
      if (!categoryArticleIds.length) {
        res.json(empty);
        return;
      }
    }

    let countRows;
    let itemRows;

    if (categoryArticleIds !== null && featuredOnly) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND featured = true AND id = ANY(${categoryArticleIds})
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND featured = true AND id = ANY(${categoryArticleIds})
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (categoryArticleIds !== null) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND id = ANY(${categoryArticleIds})
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND id = ANY(${categoryArticleIds})
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (featuredOnly) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND featured = true
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND featured = true
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published'
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const total = countRows[0]?.count ?? 0;

    res.json({
      items: itemRows ?? [],
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    });
  }),
);

// GET /api/public/articles/:slug
router.get(
  '/articles/:slug',
  wrap(async (req, res) => {
    const rows = await sql`
      SELECT * FROM public.articles
      WHERE slug = ${req.params.slug} AND status = 'published'
      LIMIT 1
    `;

    if (!rows.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

// GET /api/public/articles/:slug/related
router.get(
  '/articles/:slug/related',
  wrap(async (req, res) => {
    const rows = await sql`
      SELECT id, slug, title, excerpt, cover_image_url, published_at, reading_minutes
      FROM public.articles
      WHERE status = 'published' AND slug != ${req.params.slug}
      ORDER BY published_at DESC
      LIMIT 3
    `;
    res.json(rows ?? []);
  }),
);

// GET /api/public/sitemap-articles — slugs + updated dates for the sitemap
router.get(
  '/sitemap-articles',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT slug, updated_at, published_at
      FROM public.articles
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    res.json(rows ?? []);
  }),
);

// GET /api/public/gallery — display settings + categories + active images
router.get(
  '/gallery',
  wrap(async (_req, res) => {
    const [settingsRows, categories, images] = await Promise.all([
      sql`SELECT aspect_ratio, crop_mode, frame_style, layout, columns FROM public.gallery_settings WHERE id = 1`,
      sql`SELECT id, name, slug FROM public.gallery_categories ORDER BY sort_order ASC, name ASC`,
      sql`
        SELECT i.id, i.image_url, i.public_id, i.width, i.height, i.caption, i.alt,
               i.crop_mode, i.gravity, i.frame_style, i.sort_order,
               c.slug AS category_slug, c.name AS category_name
        FROM public.gallery_images i
        LEFT JOIN public.gallery_categories c ON c.id = i.category_id
        WHERE i.active = true
        ORDER BY i.sort_order ASC, i.created_at DESC
      `,
    ]);
    res.json({ settings: settingsRows[0] ?? null, categories, images });
  }),
);

// GET /api/public/announcement — the single live announcement (or null)
router.get(
  '/announcement',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT id, title, body_html, image_url, layout, cta_label, cta_href, updated_at
      FROM public.announcements
      WHERE is_active = true
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at > NOW())
      LIMIT 1
    `;
    res.json(rows[0] ?? null);
  }),
);

async function batchImages(batchIds: string[]) {
  if (!batchIds.length) return new Map<string, Record<string, unknown>[]>();
  const rows = await sql`
    SELECT id, batch_id, image_url, width, height, caption
    FROM public.batch_images
    WHERE batch_id = ANY(${batchIds})
    ORDER BY sort_order ASC, created_at ASC
  `;
  const byBatch = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const key = String(r.batch_id);
    if (!byBatch.has(key)) byBatch.set(key, []);
    byBatch.get(key)!.push(r);
  }
  return byBatch;
}

// GET /api/public/batches/home — batches the admin chose to feature on the homepage (with photos)
router.get(
  '/batches/home',
  wrap(async (_req, res) => {
    const batches = await sql`
      SELECT b.id, b.name, b.slug, b.description, b.start_date, b.graduation_date,
        b.featured_image_url, b.status, b.display_mode, b.show_on_home FROM public.batches b
      WHERE b.show_on_home = true
      ORDER BY b.sort_order ASC, b.graduation_date DESC NULLS LAST, b.created_at DESC
    `;
    const images = await batchImages(batches.map((b) => String(b.id)));
    res.json(batches.map((b) => ({ ...b, images: images.get(String(b.id)) ?? [] })));
  }),
);

// GET /api/public/batches — all batches (no photos), newest first
router.get(
  '/batches',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT b.id, b.name, b.slug, b.description, b.start_date, b.graduation_date,
        b.featured_image_url, b.status, b.display_mode, b.show_on_home, (SELECT count(*)::int FROM public.batch_images bi WHERE bi.batch_id = b.id) AS image_count
      FROM public.batches b
      ORDER BY b.sort_order ASC, b.graduation_date DESC NULLS LAST, b.created_at DESC
    `;
    res.json(rows);
  }),
);

// GET /api/public/batches/:slug — one batch with its photos
router.get(
  '/batches/:slug',
  wrap(async (req, res) => {
    const rows = await sql`SELECT b.id, b.name, b.slug, b.description, b.start_date, b.graduation_date,
        b.featured_image_url, b.status, b.display_mode, b.show_on_home FROM public.batches b WHERE b.slug = ${req.params.slug} LIMIT 1`;
    if (!rows.length) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    const images = await batchImages([String(rows[0].id)]);
    res.json({ ...rows[0], images: images.get(String(rows[0].id)) ?? [] });
  }),
);

// GET /api/public/courses — active courses in display order
router.get(
  '/courses',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT id, title, description, duration, level, price, features, highlighted, badge_text, cta_label, cta_href
      FROM public.courses
      WHERE active = true
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.json(rows);
  }),
);

// GET /api/public/testimonials — Google reviews + rating summary (null summary = not set up)
router.get(
  '/testimonials',
  wrap(async (_req, res) => {
    await syncIfStale();
    const rows = await sql`SELECT * FROM public.google_reviews_settings WHERE id = 1`;
    const s = rows[0];
    if (!s?.place_id) {
      res.json({ summary: null, reviews: [] });
      return;
    }
    const reviews = await sql`
      SELECT id, author_name, author_uri, author_photo_uri, rating, text, publish_time, relative_time, review_uri
      FROM public.google_reviews
      WHERE hidden = false
        AND rating >= ${s.min_rating}
        AND (in_latest_fetch = true OR ${s.keep_history}::boolean)
        AND length(trim(text)) > 0
      ORDER BY pinned DESC, publish_time DESC NULLS LAST
      LIMIT 12
    `;
    res.json({
      summary: {
        place_name: s.place_name,
        rating: s.rating !== null ? Number(s.rating) : null,
        total_reviews: s.total_reviews,
        maps_uri: s.maps_uri,
        write_review_uri: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(String(s.place_id))}`,
      },
      reviews,
    });
  }),
);

// GET /api/public/sitemap.xml — served at wsfxacademy.com/sitemap.xml via a Vercel rewrite (users/vercel.json)
router.get(
  '/sitemap.xml',
  wrap(async (_req, res) => {
    const site = env.siteUrl.replace(/\/$/, '');
    const [articles, batches] = await Promise.all([
      sql`SELECT slug, updated_at FROM public.articles WHERE status = 'published' ORDER BY published_at DESC`,
      sql`SELECT slug, updated_at FROM public.batches ORDER BY created_at DESC`,
    ]);
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const url = (path: string, lastmod?: unknown, priority = '0.6') =>
      `  <url><loc>${esc(site + path)}</loc>${
        lastmod ? `<lastmod>${new Date(String(lastmod)).toISOString()}</lastmod>` : ''
      }<priority>${priority}</priority></url>`;
    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      url('/', undefined, '1.0'),
      url('/pip-calculator', undefined, '0.9'),
      url('/blog', undefined, '0.8'),
      url('/batches', undefined, '0.7'),
      ...articles.map((a) => url(`/blog/${encodeURIComponent(String(a.slug))}`, a.updated_at, '0.7')),
      ...batches.map((b) => url(`/batches/${encodeURIComponent(String(b.slug))}`, b.updated_at, '0.5')),
      '</urlset>',
    ].join('\n');
    res.type('application/xml').send(body);
  }),
);

// GET /api/public/rates — USD-based FX rates for the pip calculator (cached 1h)
router.get(
  '/rates',
  wrap(async (_req, res) => {
    const rates = await getUsdRates();
    if (!rates) {
      res.status(503).json({ error: 'Exchange rates are unavailable right now.' });
      return;
    }
    res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
    res.json(rates);
  }),
);

// GET /api/public/news — latest forex headlines (server-side NewsAPI key)
router.get(
  '/news',
  wrap(async (_req, res) => {
    res.json(await fetchForexNews());
  }),
);

// POST /api/public/chat — WallBot (server-side OpenRouter key)
router.post(
  '/chat',
  chatLimiter,
  wrap(async (req, res) => {
    const { messages } = chatSchema.parse(req.body);
    const reply = await chat(messages);
    res.set('Cache-Control', 'no-store');
    res.json({ reply });
  }),
);

export default router;
