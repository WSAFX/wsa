'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Clock, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Course, CourseLevel } from '@/lib/types';

type Draft = Omit<Course, 'id' | 'sort_order'> & { id?: string };

const EMPTY: Draft = {
  title: '',
  description: '',
  duration: '8 Weeks',
  level: 'Beginner',
  price: '',
  features: [],
  highlighted: false,
  badge_text: 'Most Popular',
  cta_label: 'Enroll Now',
  cta_href: '',
  active: true,
};

const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_TINT: Record<CourseLevel, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-purple-100 text-purple-700',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setCourses(await api.get<Course[]>('/courses'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function edit(c: Draft) {
    setDraft(c);
    setFeaturesText(c.features.join('\n'));
    setMsg('');
    setError('');
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const features = featuresText
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError('Give the course a title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...draft, features };
      const saved = draft.id
        ? await api.put<Course>(`/courses/${draft.id}`, payload)
        : await api.post<Course>('/courses', payload);
      await load();
      edit(saved);
      setMsg('Course saved. It appears on the website within a minute.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Course) {
    if (!confirm(`Delete “${c.title}”?`)) return;
    await api.del(`/courses/${c.id}`);
    if (draft?.id === c.id) setDraft(null);
    load();
  }

  async function toggleActive(c: Course) {
    await api.put(`/courses/${c.id}`, { ...c, active: !c.active });
    load();
  }

  async function move(index: number, dir: -1 | 1) {
    if (!courses) return;
    const next = [...courses];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCourses(next);
    await api.put('/courses-reorder', { ids: next.map((c) => c.id) });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">The programs shown in the “Choose Your Path” section. WallBot also quotes these.</p>
        </div>
        <button onClick={() => edit({ ...EMPTY })} className="btn btn-primary">
          <Plus size={16} /> New course
        </button>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        {/* ---- List ---- */}
        <div className="space-y-3">
          {courses === null && <p className="text-sm text-gray-400">Loading…</p>}
          {courses?.length === 0 && <p className="card text-sm text-brand-muted">No courses yet.</p>}
          {courses?.map((c, i) => (
            <div
              key={c.id}
              className={`card flex items-center gap-3 p-4 ${draft?.id === c.id ? 'ring-2 ring-brand-primary' : ''} ${c.active ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-col text-gray-400">
                <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-brand-primary disabled:opacity-30">
                  <ArrowUp size={15} />
                </button>
                <button
                  aria-label="Move down"
                  disabled={i === courses.length - 1}
                  onClick={() => move(i, 1)}
                  className="hover:text-brand-primary disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
              <button className="min-w-0 flex-1 text-left" onClick={() => edit(c)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-ink">{c.title}</span>
                  {c.highlighted && <span className="badge badge-gold">{c.badge_text || 'Highlighted'}</span>}
                  {!c.active && <span className="badge badge-gray">Hidden</span>}
                </div>
                <p className="mt-0.5 text-xs text-brand-muted">
                  {c.level} · {c.duration} · {c.price} · {c.features.length} features
                </p>
              </button>
              <button
                title={c.active ? 'Hide from website' : 'Show on website'}
                aria-label={c.active ? 'Hide from website' : 'Show on website'}
                onClick={() => toggleActive(c)}
                className="text-gray-400 hover:text-brand-primary"
              >
                {c.active ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              <button aria-label={`Delete ${c.title}`} onClick={() => remove(c)} className="text-gray-300 hover:text-red-600">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>

        {/* ---- Editor ---- */}
        {draft ? (
          <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-brand-ink">{draft.id ? 'Edit course' : 'New course'}</p>
                <button onClick={save} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving…' : 'Save course'}
                </button>
              </div>
              {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
              <div>
                <label className="label">Title</label>
                <input className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Level</label>
                  <select className="input" value={draft.level} onChange={(e) => set('level', e.target.value as CourseLevel)}>
                    {LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" value={draft.duration} onChange={(e) => set('duration', e.target.value)} placeholder="8 Weeks" />
                </div>
                <div>
                  <label className="label">Price</label>
                  <input className="input" value={draft.price} onChange={(e) => set('price', e.target.value)} placeholder="₦150,000" />
                </div>
              </div>
              <div>
                <label className="label">Short description</label>
                <textarea className="input" rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div>
                <label className="label">What&apos;s included (one per line)</label>
                <textarea
                  className="input font-mono text-xs"
                  rows={6}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={'Live trading sessions\n1-on-1 mentorship'}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Button text</label>
                  <input className="input" value={draft.cta_label} onChange={(e) => set('cta_label', e.target.value)} />
                </div>
                <div>
                  <label className="label">Button link (optional)</label>
                  <input
                    className="input"
                    value={draft.cta_href}
                    onChange={(e) => set('cta_href', e.target.value)}
                    placeholder="Empty = WhatsApp"
                  />
                </div>
              </div>
              <p className="-mt-2 text-xs text-brand-muted">
                Leave the link empty to open WhatsApp with “I&apos;m interested in {draft.title || 'this course'}” pre-filled.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-brand-bg p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={draft.highlighted} onChange={(e) => set('highlighted', e.target.checked)} />
                  Highlight this course
                </label>
                {draft.highlighted && (
                  <input
                    className="input w-40 py-1.5"
                    value={draft.badge_text}
                    onChange={(e) => set('badge_text', e.target.value)}
                    placeholder="Most Popular"
                  />
                )}
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
                  Show on website
                </label>
              </div>
            </div>

            {/* Preview, styled like the public card */}
            <div className="rounded-2xl bg-slate-950 p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">Preview</p>
              <div className="relative mx-auto max-w-sm">
                {draft.highlighted && (
                  <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-1 text-xs font-bold text-white">
                    {draft.badge_text || 'Most Popular'}
                  </span>
                )}
                <div
                  className={`rounded-3xl border p-6 ${
                    draft.highlighted ? 'border-blue-500/40 bg-gradient-to-b from-blue-900/60 to-slate-950' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_TINT[draft.level]}`}>{draft.level}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={13} /> {draft.duration}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">{draft.title || 'Course title'}</p>
                  <p className="mt-2 text-sm text-slate-300">{draft.description}</p>
                  <p className="mt-4 text-3xl font-bold text-yellow-400">{draft.price || '₦0'}</p>
                  <ul className="mt-4 space-y-2">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={14} className="mt-0.5 shrink-0 text-blue-400" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white">
                    {draft.cta_label || 'Enroll Now'} →
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center py-16 text-sm text-brand-muted">
            Select a course to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
