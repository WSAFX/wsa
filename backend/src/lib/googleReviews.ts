import { sql } from './db';
import { env } from './env';
import { HttpError } from '../middleware/error';
import { logger } from './logger';

/**
 * Google reviews via Places API (New).
 * Needs: an API key with "Places API (New)" enabled + the business's Place ID.
 * Google returns at most 5 reviews per request ("most relevant"), so the daily sync
 * upserts them; with keep_history on, older ones stay and the collection grows.
 */

const PLACES = 'https://places.googleapis.com/v1';

interface PlaceReview {
  name: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
  googleMapsUri?: string;
}

interface PlaceDetails {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlaceReview[];
}

export interface PlaceCandidate {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  total_reviews: number | null;
}

/** Turns Google's error body into a message the admin can act on. */
async function googleError(res: Response): Promise<HttpError> {
  let message = `Google returned ${res.status}`;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body.error?.message) message = `Google: ${body.error.message}`;
  } catch {
    /* non-JSON */
  }
  return new HttpError(res.status === 400 || res.status === 403 ? 400 : 502, message);
}

/** The admin-saved key wins; the backend env is the fallback. */
export async function resolveApiKey(): Promise<{ key: string | null; source: 'admin' | 'env' | null }> {
  const rows = await sql`SELECT api_key FROM public.google_reviews_settings WHERE id = 1`;
  const saved = rows[0]?.api_key ? String(rows[0].api_key) : '';
  if (saved) return { key: saved, source: 'admin' };
  if (env.googlePlacesApiKey) return { key: env.googlePlacesApiKey, source: 'env' };
  return { key: null, source: null };
}

/** Text search so the admin can find the Place ID by typing the business name. */
export async function searchPlaces(apiKey: string, query: string): Promise<PlaceCandidate[]> {
  const res = await fetch(`${PLACES}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5 }),
  });
  if (!res.ok) throw await googleError(res);
  const data = (await res.json()) as { places?: PlaceDetails[] };
  return (data.places ?? []).map((p) => ({
    place_id: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    rating: p.rating ?? null,
    total_reviews: p.userRatingCount ?? null,
  }));
}

async function fetchPlace(apiKey: string, placeId: string): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES}/places/${encodeURIComponent(placeId)}?languageCode=en`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews',
    },
  });
  if (!res.ok) throw await googleError(res);
  return (await res.json()) as PlaceDetails;
}

export interface SyncResult {
  fetched: number;
  rating: number | null;
  total_reviews: number | null;
}

/** Pulls the latest reviews from Google and stores them. Records the error for the admin on failure. */
export async function syncGoogleReviews(): Promise<SyncResult> {
  const settingsRows = await sql`SELECT place_id, keep_history FROM public.google_reviews_settings WHERE id = 1`;
  const settings = settingsRows[0];
  const { key } = await resolveApiKey();
  if (!key) throw new HttpError(400, 'Add a Google API key first.');
  if (!settings?.place_id) throw new HttpError(400, 'Select your business (Place ID) first.');

  try {
    const place = await fetchPlace(key, String(settings.place_id));
    const reviews = (place.reviews ?? []).filter((r) => r.name && r.authorAttribution?.displayName);

    const upserts = reviews.map((r) => {
      const text = r.text?.text ?? r.originalText?.text ?? '';
      return sql`
        INSERT INTO public.google_reviews (
          review_name, author_name, author_uri, author_photo_uri, rating, text,
          language_code, publish_time, relative_time, review_uri, in_latest_fetch
        ) VALUES (
          ${r.name}, ${r.authorAttribution!.displayName!}, ${r.authorAttribution?.uri ?? null},
          ${r.authorAttribution?.photoUri ?? null}, ${Math.round(r.rating ?? 0)}, ${text},
          ${r.text?.languageCode ?? r.originalText?.languageCode ?? null}, ${r.publishTime ?? null},
          ${r.relativePublishTimeDescription ?? null}, ${r.googleMapsUri ?? null}, true
        )
        ON CONFLICT (review_name) DO UPDATE SET
          author_name = EXCLUDED.author_name,
          author_uri = EXCLUDED.author_uri,
          author_photo_uri = EXCLUDED.author_photo_uri,
          rating = EXCLUDED.rating,
          text = EXCLUDED.text,
          language_code = EXCLUDED.language_code,
          publish_time = EXCLUDED.publish_time,
          relative_time = EXCLUDED.relative_time,
          review_uri = EXCLUDED.review_uri,
          in_latest_fetch = true,
          updated_at = NOW()
      `;
    });

    const names = reviews.map((r) => r.name);
    // Reviews Google no longer returns: keep (flagged) when keep_history is on, otherwise drop them.
    const prune = settings.keep_history
      ? sql`UPDATE public.google_reviews SET in_latest_fetch = false WHERE NOT (review_name = ANY(${names}))`
      : sql`DELETE FROM public.google_reviews WHERE NOT (review_name = ANY(${names}))`;

    const summary = sql`
      UPDATE public.google_reviews_settings SET
        place_name = COALESCE(${place.displayName?.text ?? null}, place_name),
        place_address = COALESCE(${place.formattedAddress ?? null}, place_address),
        maps_uri = ${place.googleMapsUri ?? null},
        rating = ${place.rating ?? null},
        total_reviews = ${place.userRatingCount ?? null},
        last_synced_at = NOW(),
        last_error = NULL
      WHERE id = 1
    `;

    await sql.transaction([...upserts, prune, summary]);
    logger.info('google reviews synced', { fetched: reviews.length });
    return { fetched: reviews.length, rating: place.rating ?? null, total_reviews: place.userRatingCount ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sql`UPDATE public.google_reviews_settings SET last_error = ${message}, last_synced_at = NOW() WHERE id = 1`;
    logger.warn('google reviews sync failed', { message });
    throw err;
  }
}

const STALE_MS = 24 * 60 * 60 * 1000;

/** Re-syncs when the last attempt is older than a day (backup for the daily cron). Never throws. */
export async function syncIfStale(timeoutMs = 4000): Promise<void> {
  try {
    const rows = await sql`SELECT place_id, last_synced_at FROM public.google_reviews_settings WHERE id = 1`;
    const s = rows[0];
    if (!s?.place_id) return;
    const last = s.last_synced_at ? new Date(String(s.last_synced_at)).getTime() : 0;
    if (Date.now() - last < STALE_MS) return;
    await Promise.race([syncGoogleReviews(), new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  } catch {
    /* recorded in last_error; serve what we have */
  }
}
