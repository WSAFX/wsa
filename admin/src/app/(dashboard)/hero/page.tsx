'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Hero } from '@/lib/types';

/** Splits the heading so the highlighted phrase can be styled like the live site. */
function HeadingPreview({ heading, highlight }: { heading: string; highlight: string }) {
  const idx = highlight ? heading.indexOf(highlight) : -1;
  if (idx < 0) return <>{heading || 'Your heading'}</>;
  return (
    <>
      {heading.slice(0, idx)}
      <span className="bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">{highlight}</span>
      {heading.slice(idx + highlight.length)}
    </>
  );
}

export default function HeroPage() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Hero>('/hero').then(setHero).catch((e) => setError(e.message));
  }, []);

  if (error && !hero) return <p className="text-sm text-red-600">{error}</p>;
  if (!hero) return <p className="text-sm text-gray-400">Loading…</p>;

  const set = <K extends keyof Hero>(k: K, v: Hero[K]) =>
    setHero((prev) => (prev ? { ...prev, [k]: v } : prev));

  async function save() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.put('/hero', hero);
      setMsg('Hero saved. Changes appear on the site within a minute.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const highlightMissing = !!hero.heading_highlight && !hero.heading.includes(hero.heading_highlight);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Hero</h1>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save Hero'}
        </button>
      </div>
      <p className="page-subtitle">The headline section at the top of the home page.</p>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Live preview */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-12">
        {hero.badge_text && (
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            {hero.badge_text}
          </span>
        )}
        <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight text-white">
          <HeadingPreview heading={hero.heading} highlight={hero.heading_highlight} />
        </h2>
        <p className="mt-4 max-w-lg text-slate-300">{hero.subheading}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {hero.cta_label && (
            <span className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">{hero.cta_label} →</span>
          )}
          {hero.secondary_cta_label && (
            <span className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white">
              {hero.secondary_cta_label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <p className="text-sm font-bold text-brand-ink">Content</p>
          <div>
            <label className="label">Badge text</label>
            <input className="input" value={hero.badge_text} onChange={(e) => set('badge_text', e.target.value)} />
          </div>
          <div>
            <label className="label">Heading</label>
            <input className="input" value={hero.heading} onChange={(e) => set('heading', e.target.value)} />
          </div>
          <div>
            <label className="label">Highlighted words</label>
            <input
              className="input"
              value={hero.heading_highlight}
              onChange={(e) => set('heading_highlight', e.target.value)}
            />
            <p className={`mt-1 text-xs ${highlightMissing ? 'text-amber-600' : 'text-brand-muted'}`}>
              {highlightMissing
                ? 'These words are not in the heading, so nothing will be highlighted.'
                : 'Part of the heading shown in the blue-to-gold gradient.'}
            </p>
          </div>
          <div>
            <label className="label">Subheading</label>
            <textarea
              className="input"
              rows={3}
              value={hero.subheading}
              onChange={(e) => set('subheading', e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <p className="text-sm font-bold text-brand-ink">Buttons</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Primary button label</label>
              <input className="input" value={hero.cta_label} onChange={(e) => set('cta_label', e.target.value)} />
            </div>
            <div>
              <label className="label">Primary button link</label>
              <input className="input" value={hero.cta_href} onChange={(e) => set('cta_href', e.target.value)} />
            </div>
            <div>
              <label className="label">Secondary button label</label>
              <input
                className="input"
                value={hero.secondary_cta_label}
                onChange={(e) => set('secondary_cta_label', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Secondary button link</label>
              <input
                className="input"
                value={hero.secondary_cta_href}
                onChange={(e) => set('secondary_cta_href', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-brand-muted">
            Links can point to a section on the home page (<code>#courses</code>, <code>#about</code>,{' '}
            <code>#contact</code>) or a page (<code>/blog</code>). Leave a label empty to hide that button.
          </p>
        </div>
      </div>
    </div>
  );
}
