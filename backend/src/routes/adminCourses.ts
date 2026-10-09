import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { AuthedRequest } from '../middleware/auth';
import { courseSchema, reorderSchema } from '../validation/schemas';

// Mounted inside the admin router, so requireAdmin already applies.
const router = Router();

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.get(
  '/courses',
  wrap(async (_req, res) => {
    res.json(await sql`SELECT * FROM public.courses ORDER BY sort_order ASC, created_at ASC`);
  }),
);

router.post(
  '/courses',
  wrap(async (req, res) => {
    const c = courseSchema.parse(req.body);
    const rows = await sql`
      INSERT INTO public.courses (
        title, description, duration, level, price, features, highlighted,
        badge_text, cta_label, cta_href, active, sort_order
      ) VALUES (
        ${c.title}, ${c.description}, ${c.duration}, ${c.level}, ${c.price}, ${c.features}, ${c.highlighted},
        ${c.badge_text}, ${c.cta_label}, ${c.cta_href}, ${c.active},
        (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM public.courses)
      )
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/courses/:id',
  wrap(async (req, res) => {
    const c = courseSchema.parse(req.body);
    const rows = await sql`
      UPDATE public.courses SET
        title = ${c.title},
        description = ${c.description},
        duration = ${c.duration},
        level = ${c.level},
        price = ${c.price},
        features = ${c.features},
        highlighted = ${c.highlighted},
        badge_text = ${c.badge_text},
        cta_label = ${c.cta_label},
        cta_href = ${c.cta_href},
        active = ${c.active},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

router.put(
  '/courses-reorder',
  wrap(async (req, res) => {
    const { ids } = reorderSchema.parse(req.body);
    await sql.transaction(ids.map((id, i) => sql`UPDATE public.courses SET sort_order = ${i} WHERE id = ${id}`));
    res.json({ ok: true });
  }),
);

router.delete(
  '/courses/:id',
  wrap(async (req, res) => {
    await sql`DELETE FROM public.courses WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  }),
);

export default router;
