'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, EyeOff, KeyRound, MapPin, Pin, RefreshCw, Search, Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { GoogleReview, PlaceCandidate, ReviewSettings } from '@/lib/types';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </span>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return done ? (
    <CheckCircle2 size={22} className="shrink-0 text-green-600" />
  ) : (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
      {n}
    </span>
  );
}

export default function ReviewsPage() {
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [query, setQuery] = useState('Wallstreet Forex Academy Enugu');
  const [candidates, setCandidates] = useState<PlaceCandidate[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const d = await api.get<{ settings: ReviewSettings; reviews: GoogleReview[] }>('/reviews');
      setSettings(d.settings);
      setReviews(d.reviews);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run<T>(label: string, fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(label);
    setError('');
    setMsg('');
    try {
      const out = await fn();
      if (success) setMsg(success);
      return out;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  const saveSettings = (patch: Partial<ReviewSettings> & { api_key?: string | null }) =>
    api.put<ReviewSettings>('/reviews/settings', {
      place_id: settings?.place_id ?? null,
      place_name: settings?.place_name ?? null,
      place_address: settings?.place_address ?? null,
      min_rating: settings?.min_rating ?? 4,
      keep_history: settings?.keep_history ?? false,
      ...patch,
    });

  async function saveKey() {
    const s = await run('key', () => saveSettings({ api_key: apiKey.trim() }), 'API key saved.');
    if (s) {
      setSettings(s);
      setApiKey('');
    }
  }

  async function removeKey() {
    if (!confirm('Remove the saved API key?')) return;
    const s = await run('key', () => saveSettings({ api_key: null }), 'API key removed.');
    if (s) setSettings(s);
  }

  async function search() {
    const found = await run('search', () =>
      api.post<PlaceCandidate[]>('/reviews/search', { query, ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}) }),
    );
    if (found) setCandidates(found);
  }

  async function choose(p: PlaceCandidate) {
    const s = await run('choose', () =>
      saveSettings({ place_id: p.place_id, place_name: p.name, place_address: p.address }),
    );
    if (!s) return;
    setSettings(s);
    setCandidates(null);
    await sync();
  }

  async function sync() {
    const r = await run('sync', () => api.post<{ fetched: number }>('/reviews/sync'));
    await load();
    if (r) setMsg(`Synced ${r.fetched} review${r.fetched === 1 ? '' : 's'} from Google.`);
  }

  async function saveDisplay(patch: Partial<ReviewSettings>) {
    const s = await run('display', () => saveSettings(patch), 'Display settings saved.');
    if (s) setSettings(s);
  }

  async function flag(r: GoogleReview, patch: Partial<Pick<GoogleReview, 'hidden' | 'pinned'>>) {
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    await api.patch(`/reviews/${r.id}`, patch).catch(() => load());
  }

  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="text-sm text-gray-400">Loading…</p>;

  const shownCount = reviews.filter(
    (r) => !r.hidden && r.rating >= settings.min_rating && (r.in_latest_fetch || settings.keep_history) && r.text.trim(),
  ).length;

  return (
    <div>
      <h1 className="page-title">Google Reviews</h1>
      <p className="page-subtitle">
        Testimonials on the website come from your Google Business Profile and refresh automatically every day.
      </p>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {/* ---- Step 1: API key ---- */}
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <StepBadge n={1} done={settings.has_api_key} />
              <p className="font-semibold text-brand-ink">Google API key</p>
            </div>
            {settings.has_api_key && (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <KeyRound size={15} />
                {settings.api_key_source === 'env'
                  ? 'Using the key from the server environment (GOOGLE_PLACES_API_KEY).'
                  : `Key saved (ending ${settings.api_key_hint}).`}
                {settings.api_key_source === 'admin' && (
                  <button onClick={removeKey} className="text-xs text-gray-400 underline hover:text-red-600">
                    Remove
                  </button>
                )}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="password"
                autoComplete="off"
                className="input"
                placeholder={settings.has_api_key ? 'Paste a new key to replace it' : 'AIza…'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button onClick={saveKey} disabled={!apiKey.trim() || busy === 'key'} className="btn btn-primary shrink-0">
                {busy === 'key' ? 'Saving…' : 'Save key'}
              </button>
            </div>
            <details className="rounded-lg bg-brand-bg p-3 text-xs text-brand-muted">
              <summary className="cursor-pointer font-semibold text-brand-ink">How to get a key (about 5 minutes)</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>
                  Open{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">
                    Google Cloud Console
                  </a>{' '}
                  and create (or pick) a project.
                </li>
                <li>Link a billing account. Google requires one; this light daily usage stays within the monthly free allowance.</li>
                <li>
                  Go to <strong>APIs &amp; Services → Library</strong>, search <strong>“Places API (New)”</strong> and click <strong>Enable</strong>.
                </li>
                <li>
                  Go to <strong>APIs &amp; Services → Credentials → Create credentials → API key</strong>.
                </li>
                <li>
                  Edit the key → <strong>API restrictions → Restrict key → Places API (New)</strong> → Save. (Leave
                  “Application restrictions” as None: the key is only used by your server.)
                </li>
                <li>Paste the key above. It is stored on the server and never shown on the website.</li>
              </ol>
            </details>
          </div>

          {/* ---- Step 2: business ---- */}
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <StepBadge n={2} done={!!settings.place_id} />
              <p className="font-semibold text-brand-ink">Your business on Google</p>
            </div>
            {settings.place_id && (
              <div className="flex items-start gap-3 rounded-xl bg-brand-bg p-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-brand-ink">{settings.place_name || 'Selected business'}</p>
                  {settings.place_address && <p className="text-xs text-brand-muted">{settings.place_address}</p>}
                  <p className="mt-1 break-all font-mono text-[10px] text-gray-400">Place ID: {settings.place_id}</p>
                </div>
                {settings.maps_uri && (
                  <a href={settings.maps_uri} target="_blank" rel="noopener noreferrer" className="text-brand-muted hover:text-brand-primary" aria-label="Open on Google Maps">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Business name and city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
              <button
                onClick={search}
                disabled={busy === 'search' || (!settings.has_api_key && !apiKey.trim())}
                className="btn btn-ghost shrink-0"
              >
                <Search size={15} /> {busy === 'search' ? 'Searching…' : settings.place_id ? 'Change' : 'Find'}
              </button>
            </div>
            {!settings.has_api_key && <p className="text-xs text-brand-muted">Save your API key first.</p>}
            {candidates && (
              <ul className="divide-y divide-black/5 rounded-xl ring-1 ring-black/10">
                {candidates.length === 0 && <li className="p-3 text-sm text-brand-muted">No matches. Try adding the city.</li>}
                {candidates.map((p) => (
                  <li key={p.place_id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-ink">{p.name}</p>
                      <p className="truncate text-xs text-brand-muted">{p.address}</p>
                      {p.rating !== null && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
                          <Stars value={p.rating} size={11} /> {p.rating} · {p.total_reviews ?? 0} reviews
                        </p>
                      )}
                    </div>
                    <button onClick={() => choose(p)} disabled={!!busy} className="btn btn-primary py-1.5 text-xs">
                      {busy === 'choose' ? 'Saving…' : 'This is us'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---- Step 3: display + sync ---- */}
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge n={3} done={!!settings.last_synced_at && !settings.last_error} />
              <p className="font-semibold text-brand-ink">Display &amp; sync</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Show reviews rated at least</label>
                <select
                  className="input"
                  value={settings.min_rating}
                  onChange={(e) => saveDisplay({ min_rating: Number(e.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n === 1 ? '' : 's'}
                      {n === 1 ? ' (all)' : '+'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={sync} disabled={busy === 'sync' || !settings.place_id || !settings.has_api_key} className="btn btn-primary w-full">
                  <RefreshCw size={15} className={busy === 'sync' ? 'animate-spin' : ''} />
                  {busy === 'sync' ? 'Syncing…' : 'Sync now'}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.keep_history}
                onChange={(e) => saveDisplay({ keep_history: e.target.checked })}
              />
              <span>
                <span className="font-medium text-brand-ink">Keep older reviews</span>
                <span className="block text-xs text-brand-muted">
                  Google only returns 5 reviews per sync. With this on, reviews are kept after Google stops returning them,
                  so the collection grows over time. Google&apos;s Maps Platform terms limit storing Places content
                  long-term, so leave this off to stay strictly within them.
                </span>
              </span>
            </label>
            <div className="rounded-lg bg-brand-bg px-3 py-2 text-xs text-brand-muted">
              {settings.last_synced_at ? (
                <>Last sync: {new Date(settings.last_synced_at).toLocaleString()} · refreshes automatically every day.</>
              ) : (
                'Not synced yet.'
              )}
              {settings.last_error && <p className="mt-1 font-semibold text-red-600">Last error: {settings.last_error}</p>}
            </div>
          </div>
        </div>

        {/* ---- Reviews ---- */}
        <div className="space-y-3">
          <div className="card flex items-center gap-4 p-4">
            <div className="text-3xl font-bold text-brand-ink">{settings.rating?.toFixed(1) ?? '–'}</div>
            <div>
              <Stars value={settings.rating ?? 0} size={16} />
              <p className="text-xs text-brand-muted">
                {settings.total_reviews ?? 0} Google reviews · {shownCount} shown on the website
              </p>
            </div>
          </div>
          {reviews.length === 0 && (
            <p className="card text-sm text-brand-muted">
              No reviews yet. Complete the steps, then Sync. Reviews without text are not shown on the site.
            </p>
          )}
          {reviews.map((r) => {
            const filteredOut = r.rating < settings.min_rating || !r.text.trim() || (!r.in_latest_fetch && !settings.keep_history);
            return (
              <div key={r.id} className={`card p-4 ${r.hidden || filteredOut ? 'opacity-50' : ''} ${r.pinned ? 'ring-2 ring-brand-gold' : ''}`}>
                <div className="flex items-start gap-3">
                  {r.author_photo_uri ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.author_photo_uri} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                      {r.author_name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-ink">{r.author_name}</p>
                    <p className="flex items-center gap-2 text-xs text-brand-muted">
                      <Stars value={r.rating} size={11} /> {r.relative_time}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      title={r.pinned ? 'Unpin' : 'Pin to show first'}
                      aria-label={r.pinned ? 'Unpin' : 'Pin to show first'}
                      onClick={() => flag(r, { pinned: !r.pinned })}
                      className={`rounded p-1.5 ${r.pinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      title={r.hidden ? 'Show on website' : 'Hide from website'}
                      aria-label={r.hidden ? 'Show on website' : 'Hide from website'}
                      onClick={() => flag(r, { hidden: !r.hidden })}
                      className={`rounded p-1.5 ${r.hidden ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                    >
                      <EyeOff size={15} />
                    </button>
                  </div>
                </div>
                {r.text && <p className="mt-2 line-clamp-4 text-sm text-brand-ink/80">{r.text}</p>}
                {(r.hidden || filteredOut) && (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {r.hidden
                      ? 'Hidden by you'
                      : !r.text.trim()
                        ? 'No text, not shown'
                        : r.rating < settings.min_rating
                          ? `Below ${settings.min_rating}★, not shown`
                          : 'No longer returned by Google'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
