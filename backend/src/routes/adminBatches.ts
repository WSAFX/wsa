import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { destroyAsset } from '../lib/cloudinary';
import { slugify } from '../lib/slug';
import { AuthedRequest } from '../middleware/auth';
import {
  batchSchema,
  batchImagesSchema,
  batchImageUpdateSchema,
  reorderSchema,
} from '../validation/schemas';

// Mounted inside the admin router, so requireAdmin already applies.
const router = Router();

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.get(
  '/batches',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT b.*, (SELECT count(*)::int FROM public.batch_images i WHERE i.batch_id = b.id) AS image_count
      FROM public.batches b
      ORDER BY b.sort_order ASC, b.graduation_date DESC NULLS LAST, b.created_at DESC
    `;
    res.json(rows);
  }),
);

router.get(
  '/batches/:id',
  wrap(async (req, res) => {
    const [batch, images] = await Promise.all([
      sql`SELECT * FROM public.batches WHERE id = ${req.params.id} LIMIT 1`,
      sql`SELECT * FROM public.batch_images WHERE batch_id = ${req.params.id} ORDER BY sort_order ASC, created_at ASC`,
    ]);
    if (!batch.length) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    res.json({ ...batch[0], images });
  }),
);

router.post(
  '/batches',
  wrap(async (req, res) => {
    const body = batchSchema.parse(req.body);
    const rows = await sql`
      INSERT INTO public.batches (
        name, slug, description, start_date, graduation_date,
        featured_image_url, featured_public_id, status, display_mode, show_on_home, sort_order
      ) VALUES (
        ${body.name}, ${slugify(body.slug || body.name)}, ${body.description},
        ${body.start_date ?? null}, ${body.graduation_date ?? null},
        ${body.featured_image_url ?? null}, ${body.featured_public_id ?? null},
        ${body.status}, ${body.display_mode}, ${body.show_on_home}, ${body.sort_order}
      )
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/batches/:id',
  wrap(async (req, res) => {
    const body = batchSchema.parse(req.body);
    const existing = await sql`SELECT featured_public_id FROM public.batches WHERE id = ${req.params.id} LIMIT 1`;
    if (!existing.length) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const rows = await sql`
      UPDATE public.batches SET
        name = ${body.name},
        slug = ${slugify(body.slug || body.name)},
        description = ${body.description},
        start_date = ${body.start_date ?? null},
        graduation_date = ${body.graduation_date ?? null},
        featured_image_url = ${body.featured_image_url ?? null},
        featured_public_id = ${body.featured_public_id ?? null},
        status = ${body.status},
        display_mode = ${body.display_mode},
        show_on_home = ${body.show_on_home},
        sort_order = ${body.sort_order},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    const oldPublicId = existing[0].featured_public_id;
    if (oldPublicId && oldPublicId !== (body.featured_public_id ?? null)) {
      await destroyAsset(String(oldPublicId));
    }

    res.json(rows[0]);
  }),
);

// Deleting a batch removes its photos from Cloudinary too.
router.delete(
  '/batches/:id',
  wrap(async (req, res) => {
    const images = await sql`SELECT public_id FROM public.batch_images WHERE batch_id = ${req.params.id}`;
    const deleted = await sql`DELETE FROM public.batches WHERE id = ${req.params.id} RETURNING featured_public_id`;
    const publicIds = [
      deleted[0]?.featured_public_id,
      ...images.map((i) => i.public_id),
    ].filter(Boolean) as string[];
    await Promise.allSettled(publicIds.map((id) => destroyAsset(id)));
    res.json({ ok: true });
  }),
);

// ---- Batch photos ----------------------------------------------------

router.post(
  '/batches/:id/images',
  wrap(async (req, res) => {
    const { images } = batchImagesSchema.parse(req.body);
    const batch = await sql`SELECT id FROM public.batches WHERE id = ${req.params.id} LIMIT 1`;
    if (!batch.length) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    const maxRows = await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM public.batch_images WHERE batch_id = ${req.params.id}
    `;
    const start = Number(maxRows[0]?.max ?? -1) + 1;
    const results = await sql.transaction(
      images.map(
        (img, i) => sql`
          INSERT INTO public.batch_images (batch_id, image_url, public_id, width, height, caption, sort_order)
          VALUES (${req.params.id}, ${img.image_url}, ${img.public_id ?? null}, ${img.width ?? null},
                  ${img.height ?? null}, ${img.caption}, ${start + i})
          RETURNING *
        `,
      ),
    );
    res.status(201).json(results.map((r) => r[0]));
  }),
);

router.put(
  '/batches/:id/images/:imageId',
  wrap(async (req, res) => {
    const { caption } = batchImageUpdateSchema.parse(req.body);
    const rows = await sql`
      UPDATE public.batch_images SET caption = ${caption}
      WHERE id = ${req.params.imageId} AND batch_id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

router.put(
  '/batches/:id/images-reorder',
  wrap(async (req, res) => {
    const { ids } = reorderSchema.parse(req.body);
    await sql.transaction(
      ids.map(
        (imageId, index) => sql`
          UPDATE public.batch_images SET sort_order = ${index}
          WHERE id = ${imageId} AND batch_id = ${req.params.id}
        `,
      ),
    );
    res.json({ ok: true });
  }),
);

router.delete(
  '/batches/:id/images/:imageId',
  wrap(async (req, res) => {
    const rows = await sql`
      DELETE FROM public.batch_images
      WHERE id = ${req.params.imageId} AND batch_id = ${req.params.id}
      RETURNING public_id
    `;
    if (rows[0]?.public_id) await destroyAsset(String(rows[0].public_id));
    res.json({ ok: true });
  }),
);

export default router;
