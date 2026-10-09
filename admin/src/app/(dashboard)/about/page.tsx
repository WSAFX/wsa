'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Editor from '@/components/Editor';
import ImageUpload from '@/components/ImageUpload';
import type { AboutContent, TeamMember } from '@/lib/types';

export default function AboutAdminPage() {
  const [a, setA] = useState<AboutContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<AboutContent>('/about').then(setA).catch((e) => setError(e.message));
  }, []);

  if (error && !a) return <p className="text-sm text-red-600">{error}</p>;
  if (!a) return <p className="text-sm text-gray-400">Loading…</p>;

  const set = <K extends keyof AboutContent>(k: K, v: AboutContent[K]) =>
    setA((prev) => (prev ? { ...prev, [k]: v } : prev));

  function setStat(i: number, key: 'label' | 'value', val: string) {
    const stats = [...a!.stats];
    stats[i] = { ...stats[i], [key]: val };
    set('stats', stats);
  }

  function setMember(i: number, patch: Partial<TeamMember>) {
    const team = [...a!.team];
    team[i] = { ...team[i], ...patch };
    set('team', team);
  }

  function moveMember(i: number, dir: -1 | 1) {
    const team = [...a!.team];
    const j = i + dir;
    if (j < 0 || j >= team.length) return;
    [team[i], team[j]] = [team[j], team[i]];
    set('team', team);
  }

  async function save() {
    if (a!.team.some((m) => !m.name.trim() || !m.role.trim())) {
      setError('Every team member needs a name and a position.');
      return;
    }
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.put('/about', a);
      setMsg('About page saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">About &amp; Team</h1>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-6">
        <div className="card space-y-4">
          <div>
            <label className="label">Headline</label>
            <input className="input" value={a.headline} onChange={(e) => set('headline', e.target.value)} />
          </div>
          <div>
            <label className="label">Subheading</label>
            <input className="input" value={a.subheading} onChange={(e) => set('subheading', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Body</label>
          <Editor value={a.body_html} onChange={(html) => set('body_html', html)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <ImageUpload
              label="About image"
              value={a.image_url}
              folder="about"
              onUploaded={(url, publicId) => {
                set('image_url', url || null);
                set('image_public_id', publicId || null);
              }}
            />
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brand-ink">Stats</p>
              <button
                className="text-sm font-semibold text-brand-primary"
                onClick={() => set('stats', [...a.stats, { label: '', value: '' }])}
              >
                + Add stat
              </button>
            </div>
            {a.stats.map((stat, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  placeholder="Value (e.g. 10+)"
                  value={stat.value}
                  onChange={(e) => setStat(i, 'value', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Label (e.g. Years)"
                  value={stat.label}
                  onChange={(e) => setStat(i, 'label', e.target.value)}
                />
                <button
                  className="text-gray-400 hover:text-red-600"
                  onClick={() => set('stats', a.stats.filter((_, idx) => idx !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            {a.stats.length === 0 && <p className="text-sm text-gray-400">No stats added.</p>}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-brand-ink">Team</p>
              <p className="text-xs text-brand-muted">
                Name, position and picture for each person. Use a clear head-and-shoulders photo; it is
                cropped around the face automatically.
              </p>
            </div>
            <button
              className="btn btn-ghost shrink-0"
              onClick={() => set('team', [...a.team, { name: '', role: '', description: '', image_url: null }])}
            >
              + Add member
            </button>
          </div>
          {a.team.length === 0 && <p className="text-sm text-gray-400">No team members added.</p>}
          {a.team.some((m) => !m.image_url) && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {a.team.filter((m) => !m.image_url).length} member(s) have no picture yet. They show initials on the
              website until you upload one.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {a.team.map((member, i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-brand-bg/50 p-3">
                <ImageUpload
                  value={member.image_url ?? null}
                  folder="team"
                  height={200}
                  onUploaded={(url, publicId) => setMember(i, { image_url: url || null, image_public_id: publicId || null })}
                />
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="label">Name</label>
                    <input
                      className="input"
                      placeholder="Full name"
                      value={member.name}
                      onChange={(e) => setMember(i, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Position</label>
                    <input
                      className="input"
                      placeholder="e.g. Lead Instructor"
                      value={member.role}
                      onChange={(e) => setMember(i, { role: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-gray-400">
                  <div className="flex gap-1">
                    <button
                      aria-label="Move earlier"
                      disabled={i === 0}
                      onClick={() => moveMember(i, -1)}
                      className="rounded px-2 py-1 hover:bg-white hover:text-brand-primary disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      aria-label="Move later"
                      disabled={i === a.team.length - 1}
                      onClick={() => moveMember(i, 1)}
                      className="rounded px-2 py-1 hover:bg-white hover:text-brand-primary disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  <button
                    className="text-xs hover:text-red-600"
                    onClick={() => set('team', a.team.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
