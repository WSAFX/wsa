import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { destroyAsset } from '../lib/cloudinary';
import { sanitizeRichText } from '../lib/sanitize';
import { AuthedRequest } from '../middleware/auth';
import { announcementSchema, announcementToggleSchema } from '../validation/schemas';

// Mounted inside the admin router, so requireAdmin already applies.
const router = Router();

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// Only one announcement may be live: activating one switches the rest off
// in the same transaction (the DB's partial unique index is the backstop).
const deactivateOthers = (id: string | null) =>
  id
    ? sql`UPDATE public.announcements SET is_active = false WHERE is_active = true AND id <> ${id}`
    : sql`UPDATE public.announcements SET is_active = false WHERE is_active = true`;

router.get(
  '/announcements',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT id, title, image_url, layout, is_active, starts_at, ends_at, created_at, updated_at
      FROM public.announcements
      ORDER BY is_active DESC, updated_at DESC
    `;
    res.json(rows);
  }),
);

router.get(
  '/announcements/:id',
  wrap(async (req, res) => {
    const rows = await sql`SELECT * FROM public.announcements WHERE id = ${req.params.id} LIMIT 1`;
    if (!rows.length) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

router.post(
  '/announcements',
  wrap(async (req, res) => {
    const body = announcementSchema.parse(req.body);
    const insert = sql`
      INSERT INTO public.announcements (
        title, body_html, image_url, image_public_id, layout,
        cta_label, cta_href, is_active, starts_at, ends_at
      ) VALUES (
        ${body.title}, ${sanitizeRichText(body.body_html)}, ${body.image_url ?? null},
        ${body.image_public_id ?? null}, ${body.layout}, ${body.cta_label}, ${body.cta_href},
        ${body.is_active}, ${iso(body.starts_at)}, ${iso(body.ends_at)}
      )
      RETURNING *
    `;
    const results = body.is_active
      ? await sql.transaction([deactivateOthers(null), insert])
      : [await insert];
    res.status(201).json(results[results.length - 1][0]);
  }),
);

router.put(
  '/announcements/:id',
  wrap(async (req, res) => {
    const body = announcementSchema.parse(req.body);
    const existing = await sql`SELECT image_public_id FROM public.announcements WHERE id = ${req.params.id} LIMIT 1`;
    if (!existing.length) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    const update = sql`
      UPDATE public.announcements SET
        title = ${body.title},
        body_html = ${sanitizeRichText(body.body_html)},
        image_url = ${body.image_url ?? null},
        image_public_id = ${body.image_public_id ?? null},
        layout = ${body.layout},
        cta_label = ${body.cta_label},
        cta_href = ${body.cta_href},
        is_active = ${body.is_active},
        starts_at = ${iso(body.starts_at)},
        ends_at = ${iso(body.ends_at)},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    const results = body.is_active
      ? await sql.transaction([deactivateOthers(req.params.id), update])
      : [await update];

    // Clean up the old image if it was replaced or removed.
    const oldPublicId = existing[0].image_public_id;
    if (oldPublicId && oldPublicId !== (body.image_public_id ?? null)) {
      await destroyAsset(String(oldPublicId));
    }

    res.json(results[results.length - 1][0]);
  }),
);

// Quick on/off switch from the list view.
router.patch(
  '/announcements/:id/active',
  wrap(async (req, res) => {
    const { is_active } = announcementToggleSchema.parse(req.body);
    const update = sql`
      UPDATE public.announcements SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING id, title, is_active
    `;
    const results = is_active
      ? await sql.transaction([deactivateOthers(req.params.id), update])
      : [await update];
    const row = results[results.length - 1][0];
    if (!row) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(row);
  }),
);

router.delete(
  '/announcements/:id',
  wrap(async (req, res) => {
    const rows = await sql`DELETE FROM public.announcements WHERE id = ${req.params.id} RETURNING image_public_id`;
    if (rows[0]?.image_public_id) await destroyAsset(String(rows[0].image_public_id));
    res.json({ ok: true });
  }),
);

export default router;
