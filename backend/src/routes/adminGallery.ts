import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { destroyAsset } from '../lib/cloudinary';
import { slugify } from '../lib/slug';
import { AuthedRequest } from '../middleware/auth';
import {
  galleryImageSchema,
  galleryImageUpdateSchema,
  galleryBulkSchema,
  gallerySettingsSchema,
  galleryCategorySchema,
  reorderSchema,
} from '../validation/schemas';

// Mounted inside the admin router, so requireAdmin already applies.
const router = Router();

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

function insertImage(img: ReturnType<typeof galleryImageSchema.parse>) {
  return sql`
    INSERT INTO public.gallery_images (
      image_url, public_id, width, height, caption, alt, category_id,
      crop_mode, gravity, frame_style, sort_order, active
    ) VALUES (
      ${img.image_url}, ${img.public_id ?? null}, ${img.width ?? null}, ${img.height ?? null},
      ${img.caption}, ${img.alt}, ${img.category_id ?? null},
      ${img.crop_mode ?? null}, ${img.gravity}, ${img.frame_style ?? null},
      ${img.sort_order}, ${img.active}
    )
    RETURNING *
  `;
}

// GET /api/admin/gallery — everything the gallery manager needs in one call
router.get(
  '/gallery',
  wrap(async (_req, res) => {
    const [settings, categories, images] = await Promise.all([
      sql`SELECT * FROM public.gallery_settings WHERE id = 1`,
      sql`
        SELECT c.*, (SELECT count(*)::int FROM public.gallery_images i WHERE i.category_id = c.id) AS image_count
        FROM public.gallery_categories c
        ORDER BY c.sort_order ASC, c.name ASC
      `,
      sql`SELECT * FROM public.gallery_images ORDER BY sort_order ASC, created_at DESC`,
    ]);
    res.json({ settings: settings[0] ?? null, categories, images });
  }),
);

router.put(
  '/gallery/settings',
  wrap(async (req, res) => {
    const body = gallerySettingsSchema.parse(req.body);
    const updated = await sql`
      UPDATE public.gallery_settings SET
        aspect_ratio = ${body.aspect_ratio},
        crop_mode = ${body.crop_mode},
        frame_style = ${body.frame_style},
        layout = ${body.layout},
        columns = ${body.columns},
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    res.json(updated[0]);
  }),
);

// ---- Images ----------------------------------------------------------

router.post(
  '/gallery/images',
  wrap(async (req, res) => {
    const body = galleryImageSchema.parse(req.body);
    const rows = await insertImage(body);
    res.status(201).json(rows[0]);
  }),
);

// Bulk upload: the admin uploads N files to Cloudinary, then saves them in one transaction.
router.post(
  '/gallery/images/bulk',
  wrap(async (req, res) => {
    const { images } = galleryBulkSchema.parse(req.body);
    const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM public.gallery_images`;
    const start = Number(maxRows[0]?.max ?? -1) + 1;
    const results = await sql.transaction(
      images.map((img, i) => insertImage({ ...img, sort_order: start + i })),
    );
    res.status(201).json(results.map((r) => r[0]));
  }),
);

router.put(
  '/gallery/images/:id',
  wrap(async (req, res) => {
    const body = galleryImageUpdateSchema.parse(req.body);
    const existing = await sql`SELECT * FROM public.gallery_images WHERE id = ${req.params.id} LIMIT 1`;
    if (!existing.length) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    const cur = existing[0];
    const pick = <K extends keyof typeof body>(k: K) => (body[k] !== undefined ? body[k] : cur[k as string]);

    const updated = await sql`
      UPDATE public.gallery_images SET
        caption = ${pick('caption')},
        alt = ${pick('alt')},
        category_id = ${pick('category_id') ?? null},
        crop_mode = ${pick('crop_mode') ?? null},
        gravity = ${pick('gravity')},
        frame_style = ${pick('frame_style') ?? null},
        sort_order = ${pick('sort_order')},
        active = ${pick('active')}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    res.json(updated[0]);
  }),
);

router.put(
  '/gallery/reorder',
  wrap(async (req, res) => {
    const { ids } = reorderSchema.parse(req.body);
    await sql.transaction(
      ids.map((id, index) => sql`UPDATE public.gallery_images SET sort_order = ${index} WHERE id = ${id}`),
    );
    res.json({ ok: true });
  }),
);

router.delete(
  '/gallery/images/:id',
  wrap(async (req, res) => {
    const rows = await sql`DELETE FROM public.gallery_images WHERE id = ${req.params.id} RETURNING public_id`;
    if (rows[0]?.public_id) await destroyAsset(String(rows[0].public_id));
    res.json({ ok: true });
  }),
);

// ---- Categories ------------------------------------------------------

router.post(
  '/gallery/categories',
  wrap(async (req, res) => {
    const body = galleryCategorySchema.parse(req.body);
    const rows = await sql`
      INSERT INTO public.gallery_categories (name, slug, sort_order)
      VALUES (${body.name}, ${slugify(body.slug || body.name)}, ${body.sort_order})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/gallery/categories/:id',
  wrap(async (req, res) => {
    const body = galleryCategorySchema.parse(req.body);
    const rows = await sql`
      UPDATE public.gallery_categories SET
        name = ${body.name},
        slug = ${slugify(body.slug || body.name)},
        sort_order = ${body.sort_order}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

// Images in a deleted category are kept and become "uncategorised" (ON DELETE SET NULL).
router.delete(
  '/gallery/categories/:id',
  wrap(async (req, res) => {
    await sql`DELETE FROM public.gallery_categories WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  }),
);

export default router;
