'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import type { SiteSettings } from '@/lib/types';

export default function AppearancePage() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<SiteSettings>('/site-settings').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!s) return <p className="text-sm text-gray-400">Loading…</p>;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));

  async function save() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.put('/site-settings', s);
      setMsg('Logo saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Logo</h1>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="page-subtitle">
        Shown in the site header, footer and browser tab. A transparent PNG or SVG works best.
      </p>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 max-w-md">
        <div className="card">
          <ImageUpload
            label="Logo"
            value={s.logo_url}
            folder="brand"
            onUploaded={(url, publicId) => {
              set('logo_url', url || null);
              set('logo_public_id', publicId || null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
