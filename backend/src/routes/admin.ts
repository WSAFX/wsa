import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { buildUploadSignature, destroyAsset } from '../lib/cloudinary';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { slugify, estimateReadingMinutes } from '../lib/slug';
import { sanitizeRichText } from '../lib/sanitize';
import { mediaLimiter } from '../middleware/rateLimit';
import galleryRoutes from './adminGallery';
import announcementRoutes from './adminAnnouncements';
import batchRoutes from './adminBatches';
import courseRoutes from './adminCourses';
import reviewRoutes from './adminReviews';
import {
  articleSchema,
  heroSchema,
  siteSettingsSchema,
  aboutSchema,
  categorySchema,
  mediaSignSchema,
  mediaDestroySchema,
} from '../validation/schemas';

const router = Router();
router.use(requireAdmin);
router.use(galleryRoutes);
router.use(announcementRoutes);
router.use(batchRoutes);
router.use(courseRoutes);
router.use(reviewRoutes);

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// ---------------------------------------------------------------------
// Media (Cloudinary)
// ---------------------------------------------------------------------
router.post(
  '/media/sign',
  mediaLimiter,
  wrap(async (req, res) => {
    const { folder } = mediaSignSchema.parse(req.body);
    res.json(buildUploadSignature(folder));
  }),
);

router.delete(
  '/media',
  wrap(async (req, res) => {
    const { public_id } = mediaDestroySchema.parse(req.body);
    await destroyAsset(public_id);
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------
router.get(
  '/stats',
  wrap(async (_req, res) => {
    const [counts, activeAnnouncement] = await Promise.all([
      sql`
        SELECT
          (SELECT count(*)::int FROM public.articles) AS articles,
          (SELECT count(*)::int FROM public.articles WHERE status = 'published') AS published,
          (SELECT count(*)::int FROM public.categories) AS categories,
          (SELECT count(*)::int FROM public.gallery_images) AS gallery,
          (SELECT count(*)::int FROM public.batches) AS batches
      `,
      sql`SELECT id, title FROM public.announcements WHERE is_active = true LIMIT 1`,
    ]);

    const c = counts[0] ?? {};
    const articles = Number(c.articles ?? 0);
    const published = Number(c.published ?? 0);

    res.json({
      articles,
      published,
      drafts: articles - published,
      categories: Number(c.categories ?? 0),
      gallery: Number(c.gallery ?? 0),
      batches: Number(c.batches ?? 0),
      activeAnnouncement: activeAnnouncement[0] ?? null,
    });
  }),
);

// ---------------------------------------------------------------------
// Articles CRUD
// ---------------------------------------------------------------------
router.get(
  '/articles',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT id, slug, title, status, featured, published_at, updated_at, cover_image_url
      FROM public.articles
      ORDER BY updated_at DESC
    `;
    res.json(rows ?? []);
  }),
);

router.get(
  '/articles/:id',
  wrap(async (req, res) => {
    const articleRows = await sql`
      SELECT * FROM public.articles
      WHERE id = ${req.params.id}
      LIMIT 1
    `;

    if (!articleRows.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const catRows = await sql`
      SELECT category_id FROM public.article_categories
      WHERE article_id = ${req.params.id}
    `;

    res.json({
      ...articleRows[0],
      article_categories: catRows.map((c) => ({ category_id: String(c.category_id) })),
    });
  }),
);

async function setArticleCategories(articleId: string, categoryIds: string[]) {
  await sql`DELETE FROM public.article_categories WHERE article_id = ${articleId}`;
  if (categoryIds.length) {
    for (const catId of categoryIds) {
      await sql`
        INSERT INTO public.article_categories (article_id, category_id)
        VALUES (${articleId}, ${catId})
      `;
    }
  }
}

router.post(
  '/articles',
  wrap(async (req, res) => {
    const body = articleSchema.parse(req.body);
    const slug = slugify(body.slug || body.title);
    const content = sanitizeRichText(body.content_html);

    const publishedAt = body.status === 'published' ? new Date().toISOString() : null;
    const readingMinutes = estimateReadingMinutes(content);

    const inserted = await sql`
      INSERT INTO public.articles (
        title, slug, excerpt, content_html, cover_image_url, cover_public_id,
        meta_title, meta_description, keywords, status, featured, author,
        reading_minutes, published_at
      ) VALUES (
        ${body.title}, ${slug}, ${body.excerpt}, ${content}, ${body.cover_image_url ?? null},
        ${body.cover_public_id ?? null}, ${body.meta_title}, ${body.meta_description},
        ${body.keywords}, ${body.status}, ${body.featured}, ${body.author || 'Wallstreet Forex Academy'},
        ${readingMinutes}, ${publishedAt}
      )
      RETURNING *
    `;

    const data = inserted[0];
    await setArticleCategories(String(data.id), body.category_ids);
    res.status(201).json(data);
  }),
);

router.put(
  '/articles/:id',
  wrap(async (req, res) => {
    const body = articleSchema.parse(req.body);

    const existingRows = await sql`
      SELECT status, published_at FROM public.articles
      WHERE id = ${req.params.id}
      LIMIT 1
    `;
    const existing = existingRows[0];

    const slug = slugify(body.slug || body.title);
    const content = sanitizeRichText(body.content_html);
    const becomingPublished = body.status === 'published';
    const publishedAt =
      becomingPublished && !existing?.published_at
        ? new Date().toISOString()
        : becomingPublished
        ? existing.published_at
        : null;

    const updated = await sql`
      UPDATE public.articles SET
        title = ${body.title},
        slug = ${slug},
        excerpt = ${body.excerpt},
        content_html = ${content},
        cover_image_url = ${body.cover_image_url ?? null},
        cover_public_id = ${body.cover_public_id ?? null},
        meta_title = ${body.meta_title},
        meta_description = ${body.meta_description},
        keywords = ${body.keywords},
        status = ${body.status},
        featured = ${body.featured},
        author = ${body.author || 'Wallstreet Forex Academy'},
        reading_minutes = ${estimateReadingMinutes(content)},
        published_at = ${publishedAt},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (!updated.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const data = updated[0];
    await setArticleCategories(String(data.id), body.category_ids);
    res.json(data);
  }),
);

router.delete(
  '/articles/:id',
  wrap(async (req, res) => {
    const existingRows = await sql`
      SELECT cover_public_id FROM public.articles
      WHERE id = ${req.params.id}
      LIMIT 1
    `;
    const existing = existingRows[0];
    if (existing?.cover_public_id) {
      await destroyAsset(String(existing.cover_public_id));
    }

    await sql`DELETE FROM public.articles WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------
router.get(
  '/hero',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.hero_settings WHERE id = 1 LIMIT 1`;
    res.json(rows[0] || {});
  }),
);

router.put(
  '/hero',
  wrap(async (req, res) => {
    const body = heroSchema.parse(req.body);
    const updated = await sql`
      UPDATE public.hero_settings SET
        badge_text = ${body.badge_text},
        heading = ${body.heading},
        heading_highlight = ${body.heading_highlight},
        subheading = ${body.subheading},
        cta_label = ${body.cta_label},
        cta_href = ${body.cta_href},
        secondary_cta_label = ${body.secondary_cta_label},
        secondary_cta_href = ${body.secondary_cta_href},
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    res.json(updated[0]);
  }),
);

// ---------------------------------------------------------------------
// Site settings (appearance + business + SEO)
// ---------------------------------------------------------------------
router.get(
  '/site-settings',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.site_settings WHERE id = 1 LIMIT 1`;
    res.json(rows[0] || {});
  }),
);

router.put(
  '/site-settings',
  wrap(async (req, res) => {
    const body = siteSettingsSchema.parse(req.body);
    const updated = await sql`
      UPDATE public.site_settings SET
        business_name = ${body.business_name},
        tagline = ${body.tagline},
        logo_url = ${body.logo_url ?? null},
        logo_public_id = ${body.logo_public_id ?? null},
        primary_color = ${body.primary_color},
        secondary_color = ${body.secondary_color},
        default_hero_color = ${body.default_hero_color},
        phone = ${body.phone},
        whatsapp = ${body.whatsapp},
        email = ${body.email},
        address = ${body.address},
        city = ${body.city},
        state = ${body.state},
        country = ${body.country},
        lat = ${body.lat ?? null},
        lng = ${body.lng ?? null},
        facebook_url = ${body.facebook_url},
        instagram_url = ${body.instagram_url},
        youtube_url = ${body.youtube_url},
        tiktok_url = ${body.tiktok_url},
        linkedin_url = ${body.linkedin_url},
        google_maps_url = ${body.google_maps_url},
        default_meta_title = ${body.default_meta_title},
        default_meta_description = ${body.default_meta_description},
        copyright_text = ${body.copyright_text ?? ''},
        business_hours = ${body.business_hours},
        whatsapp_widget_enabled = ${body.whatsapp_widget_enabled},
        whatsapp_greeting = ${body.whatsapp_greeting},
        whatsapp_message = ${body.whatsapp_message},
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    res.json(updated[0]);
  }),
);

// ---------------------------------------------------------------------
// About content
// ---------------------------------------------------------------------
router.get(
  '/about',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.about_content WHERE id = 1 LIMIT 1`;
    res.json(rows[0] || {});
  }),
);

router.put(
  '/about',
  wrap(async (req, res) => {
    const body = aboutSchema.parse(req.body);
    const bodyHtml = sanitizeRichText(body.body_html);
    const statsJson = JSON.stringify(body.stats);
    const teamJson = JSON.stringify(body.team);

    const updated = await sql`
      UPDATE public.about_content SET
        headline = ${body.headline},
        subheading = ${body.subheading},
        body_html = ${bodyHtml},
        image_url = ${body.image_url ?? null},
        image_public_id = ${body.image_public_id ?? null},
        stats = ${statsJson}::jsonb,
        team = ${teamJson}::jsonb,
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    res.json(updated[0]);
  }),
);

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------
router.get(
  '/categories',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT * FROM public.categories
      ORDER BY name ASC
    `;
    res.json(rows ?? []);
  }),
);

router.post(
  '/categories',
  wrap(async (req, res) => {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.slug || body.name);
    const inserted = await sql`
      INSERT INTO public.categories (name, slug, description)
      VALUES (${body.name}, ${slug}, ${body.description})
      RETURNING *
    `;
    res.status(201).json(inserted[0]);
  }),
);

router.put(
  '/categories/:id',
  wrap(async (req, res) => {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.slug || body.name);
    const updated = await sql`
      UPDATE public.categories SET
        name = ${body.name},
        slug = ${slug},
        description = ${body.description}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!updated.length) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(updated[0]);
  }),
);

router.delete(
  '/categories/:id',
  wrap(async (req, res) => {
    await sql`DELETE FROM public.categories WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  }),
);

export default router;
