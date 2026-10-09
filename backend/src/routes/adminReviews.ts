import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { resolveApiKey, searchPlaces, syncGoogleReviews } from '../lib/googleReviews';
import { placeSearchSchema, reviewFlagsSchema, reviewSettingsSchema } from '../validation/schemas';

// Mounted inside the admin router, so requireAdmin already applies.
const router = Router();

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** Settings without the secret: only whether a key exists, where it comes from, and its last 4 characters. */
async function publicSettings() {
  const rows = await sql`SELECT * FROM public.google_reviews_settings WHERE id = 1`;
  const { api_key, ...rest } = rows[0] ?? {};
  const { key, source } = await resolveApiKey();
  return {
    ...rest,
    rating: rest.rating !== null && rest.rating !== undefined ? Number(rest.rating) : null,
    has_api_key: !!key,
    api_key_source: source,
    api_key_hint: api_key ? `…${String(api_key).slice(-4)}` : null,
  };
}

router.get(
  '/reviews',
  wrap(async (_req, res) => {
    const [settings, reviews] = await Promise.all([
      publicSettings(),
      sql`SELECT * FROM public.google_reviews ORDER BY pinned DESC, publish_time DESC NULLS LAST`,
    ]);
    res.json({ settings, reviews });
  }),
);

router.put(
  '/reviews/settings',
  wrap(async (req, res) => {
    const body = reviewSettingsSchema.parse(req.body);
    const prev = await sql`SELECT place_id FROM public.google_reviews_settings WHERE id = 1`;
    const placeChanged = (prev[0]?.place_id ?? null) !== (body.place_id || null);

    if (body.api_key !== undefined) {
      await sql`UPDATE public.google_reviews_settings SET api_key = ${body.api_key || null} WHERE id = 1`;
    }
    await sql`
      UPDATE public.google_reviews_settings SET
        place_id = ${body.place_id || null},
        place_name = ${body.place_name ?? null},
        place_address = ${body.place_address ?? null},
        min_rating = ${body.min_rating},
        keep_history = ${body.keep_history},
        updated_at = NOW()
      WHERE id = 1
    `;
    // Reviews belong to one business — switching businesses starts fresh.
    if (placeChanged) {
      await sql`DELETE FROM public.google_reviews`;
      await sql`
        UPDATE public.google_reviews_settings
        SET maps_uri = NULL, rating = NULL, total_reviews = NULL, last_synced_at = NULL, last_error = NULL
        WHERE id = 1
      `;
    }
    res.json(await publicSettings());
  }),
);

router.post(
  '/reviews/search',
  wrap(async (req, res) => {
    const { query, api_key } = placeSearchSchema.parse(req.body);
    const key = api_key || (await resolveApiKey()).key;
    if (!key) throw new HttpError(400, 'Add a Google API key first.');
    res.json(await searchPlaces(key, query));
  }),
);

router.post(
  '/reviews/sync',
  wrap(async (_req, res) => {
    const result = await syncGoogleReviews();
    res.json(result);
  }),
);

router.patch(
  '/reviews/:id',
  wrap(async (req, res) => {
    const body = reviewFlagsSchema.parse(req.body);
    const rows = await sql`
      UPDATE public.google_reviews SET
        hidden = COALESCE(${body.hidden ?? null}, hidden),
        pinned = COALESCE(${body.pinned ?? null}, pinned)
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

export default router;
