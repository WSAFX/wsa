'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import Editor from '@/components/Editor';
import ImageUpload from '@/components/ImageUpload';
import AnnouncementPreview from '@/components/AnnouncementPreview';
import type { Announcement, AnnouncementLayout } from '@/lib/types';

export interface AnnouncementFormValues {
  id?: string;
  title: string;
  body_html: string;
  image_url: string | null;
  image_public_id: string | null;
  layout: AnnouncementLayout;
  cta_label: string;
  cta_href: string;
  is_active: boolean;
  starts_at: string; // datetime-local value, '' = none
  ends_at: string;
}

export const EMPTY_ANNOUNCEMENT: AnnouncementFormValues = {
  title: '',
  body_html: '',
  image_url: null,
  image_public_id: null,
  layout: 'image_top',
  cta_label: '',
  cta_href: '',
  is_active: false,
  starts_at: '',
  ends_at: '',
};

/** ISO → value for <input type="datetime-local"> in the admin's own timezone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const LAYOUTS: { value: AnnouncementLayout; label: string; desc: string }[] = [
  { value: 'image_top', label: 'Image on top', desc: 'Banner image above the text' },
  { value: 'image_left', label: 'Image beside', desc: 'Side by side (stacks on phones)' },
  { value: 'image_background', label: 'Full image', desc: 'Text over a darkened image' },
];

export default function AnnouncementForm({ initial }: { initial: AnnouncementFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const set = <K extends keyof AnnouncementFormValues>(k: K, val: AnnouncementFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function save(activate?: boolean) {
    if (!v.title.trim()) {
      setError('Add a title first.');
      return;
    }
    setSaving(true);
    setError('');
    setMsg('');
    const payload = {
      ...v,
      is_active: activate ?? v.is_active,
      // datetime-local has no zone; new Date() reads it as the admin's local time.
      starts_at: v.starts_at ? new Date(v.starts_at).toISOString() : null,
      ends_at: v.ends_at ? new Date(v.ends_at).toISOString() : null,
    };
    try {
      const saved = v.id
        ? await api.put<Announcement>(`/announcements/${v.id}`, payload)
        : await api.post<Announcement>('/announcements', payload);
      setV((p) => ({ ...p, id: saved.id, is_active: saved.is_active }));
      setMsg(
        saved.is_active
          ? 'Saved and live. Visitors will see it on their next page load (within a minute).'
          : 'Saved as a draft. It is not showing on the site.',
      );
      if (!v.id) router.replace(`/announcements/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/announcements" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-primary">
        <ArrowLeft size={16} /> All announcements
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{v.id ? 'Edit announcement' : 'New announcement'}</h1>
          <span className={`badge ${v.is_active ? 'badge-green' : 'badge-gray'}`}>{v.is_active ? 'Live' : 'Off'}</span>
        </div>
        <div className="flex gap-2">
          {v.is_active ? (
            <>
              <button onClick={() => save(false)} disabled={saving} className="btn btn-ghost">
                Turn off
              </button>
              <button onClick={() => save()} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => save(false)} disabled={saving} className="btn btn-ghost">
                Save draft
              </button>
              <button onClick={() => save(true)} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving…' : 'Save & go live'}
              </button>
            </>
          )}
        </div>
      </div>
      <p className="page-subtitle">
        A live announcement pops up every time someone opens the website, until you turn it off. Only one can be
        live at a time; publishing this one turns the others off.
      </p>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* ---- Builder ---- */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                className="input text-base font-semibold"
                placeholder="e.g. Batch 15 registration is now open!"
                value={v.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className="label">Body</label>
              <Editor value={v.body_html} onChange={(html) => set('body_html', html)} />
            </div>
          </div>

          <div className="card space-y-4">
            <ImageUpload
              label="Image (optional)"
              value={v.image_url}
              folder="announcements"
              height={140}
              onUploaded={(url, publicId) => {
                set('image_url', url || null);
                set('image_public_id', publicId || null);
              }}
            />
            {v.image_url && (
              <div>
                <label className="label">Layout</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => set('layout', l.value)}
                      className={`rounded-xl p-3 text-left ring-1 transition ${
                        v.layout === l.value ? 'bg-brand-primary/5 ring-2 ring-brand-primary' : 'ring-black/10 hover:ring-brand-primary/50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-brand-ink">{l.label}</p>
                      <p className="text-xs text-brand-muted">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <p className="text-sm font-bold text-brand-ink">Button (optional)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Button text</label>
                <input
                  className="input"
                  placeholder="e.g. Register now"
                  value={v.cta_label}
                  onChange={(e) => set('cta_label', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Button link</label>
                <input
                  className="input"
                  placeholder="#contact, /blog/..., https://wa.me/..."
                  value={v.cta_href}
                  onChange={(e) => set('cta_href', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <p className="text-sm font-bold text-brand-ink">Schedule (optional)</p>
              <p className="text-xs text-brand-muted">
                While live, it only shows between these times. Leave empty to show until you turn it off.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Start showing</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={v.starts_at}
                  onChange={(e) => set('starts_at', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Stop showing</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={v.ends_at}
                  onChange={(e) => set('ends_at', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---- Live preview ---- */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Live preview</p>
            <div className="flex rounded-lg bg-white p-1 ring-1 ring-black/10">
              {(['desktop', 'mobile'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-label={`${d} preview`}
                  className={`rounded-md px-2.5 py-1.5 ${device === d ? 'bg-brand-primary text-white' : 'text-brand-muted'}`}
                >
                  {d === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
                </button>
              ))}
            </div>
          </div>
          <AnnouncementPreview a={v} device={device} />
        </div>
      </div>
    </div>
  );
}
