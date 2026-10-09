'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<SiteSettings>('/site-settings').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error && !s) return <p className="text-sm text-red-600">{error}</p>;
  if (!s) return <p className="text-sm text-gray-400">Loading…</p>;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));

  async function save() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.put('/site-settings', s);
      setMsg('Settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Business &amp; SEO</h1>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <p className="text-sm font-bold text-brand-ink">Business</p>
          <Field label="Business name" value={s.business_name} onChange={(v) => set('business_name', v)} />
          <Field label="Tagline" value={s.tagline} onChange={(v) => set('tagline', v)} />
          <Field
            label="Footer copyright text"
            value={s.copyright_text ?? ''}
            onChange={(v) => set('copyright_text', v)}
            placeholder="© {year} {business_name}. Forex education in Enugu, Nigeria."
            hint="Custom footer copyright. Supports {business_name} (uses Business name above) and {year} placeholders."
          />
          <Field label="Phone" value={s.phone} onChange={(v) => set('phone', v)} />
          <Field label="Email" value={s.email} onChange={(v) => set('email', v)} />
          <Field
            label="Business hours"
            value={s.business_hours ?? ''}
            onChange={(v) => set('business_hours', v)}
            placeholder="Mon - Sat: 9AM - 6PM"
          />
          <Field
            label="Street / Physical Address"
            value={s.address}
            onChange={(v) => set('address', v)}
            placeholder="e.g. 50 Zik Ave, Uwani, Enugu"
          />
          <Field
            label="Google Maps link"
            value={s.google_maps_url ?? ''}
            onChange={(v) => set('google_maps_url', v)}
            placeholder="https://maps.app.goo.gl/..."
            hint="Used for the 'Get directions' button on the contact section."
          />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" value={s.city} onChange={(v) => set('city', v)} />
            <Field label="State" value={s.state} onChange={(v) => set('state', v)} />
            <Field label="Country" value={s.country} onChange={(v) => set('country', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude</label>
              <input
                className="input"
                value={s.lat ?? ''}
                onChange={(e) => set('lat', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                className="input"
                value={s.lng ?? ''}
                onChange={(e) => set('lng', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brand-ink">WhatsApp chat widget</p>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-muted">
                <input
                  type="checkbox"
                  checked={s.whatsapp_widget_enabled ?? true}
                  onChange={(e) => set('whatsapp_widget_enabled', e.target.checked)}
                />
                Show on website
              </label>
            </div>
            <Field
              label="WhatsApp number"
              value={s.whatsapp}
              onChange={(v) => set('whatsapp', v)}
              placeholder="+234 801 234 5678"
              hint="Include the country code (234 for Nigeria). Spaces and + are fine. Also used by the course “Enroll” buttons."
            />
            <div>
              <label className="label">Greeting (shown in the widget bubble)</label>
              <textarea
                className="input"
                rows={2}
                value={s.whatsapp_greeting ?? ''}
                onChange={(e) => set('whatsapp_greeting', e.target.value)}
                placeholder="Hi there 👋 Have a question? Chat with us on WhatsApp."
              />
            </div>
            <div>
              <label className="label">Pre-filled message (what the visitor sends)</label>
              <textarea
                className="input"
                rows={2}
                value={s.whatsapp_message ?? ''}
                onChange={(e) => set('whatsapp_message', e.target.value)}
                placeholder="Hello, I would like to know more about your courses."
              />
            </div>
            {s.whatsapp && (
              <a
                href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(s.whatsapp_message ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-brand-primary hover:underline"
              >
                Test this WhatsApp link →
              </a>
            )}
          </div>

          <div className="card space-y-4">
            <p className="text-sm font-bold text-brand-ink">Social Links</p>
            <Field label="Facebook URL" value={s.facebook_url} onChange={(v) => set('facebook_url', v)} />
            <Field label="Instagram URL" value={s.instagram_url} onChange={(v) => set('instagram_url', v)} />
            <Field
              label="YouTube URL"
              value={s.youtube_url ?? ''}
              onChange={(v) => set('youtube_url', v)}
              placeholder="https://www.youtube.com/@yourchannel"
            />
            <Field
              label="TikTok URL"
              value={s.tiktok_url ?? ''}
              onChange={(v) => set('tiktok_url', v)}
              placeholder="https://www.tiktok.com/@yourhandle"
            />
            <Field
              label="LinkedIn URL"
              value={s.linkedin_url ?? ''}
              onChange={(v) => set('linkedin_url', v)}
              placeholder="https://linkedin.com/company/yourcompany"
            />
            <p className="text-xs text-brand-muted">
              Social links appear in the footer and are sent to Google as your official profiles
              (sameAs structured data).
            </p>
          </div>

          <div className="card space-y-4">
            <p className="text-sm font-bold text-brand-ink">Default SEO</p>
            <Field
              label="Default meta title"
              value={s.default_meta_title}
              onChange={(v) => set('default_meta_title', v)}
            />
            <div>
              <label className="label">Default meta description</label>
              <textarea
                className="input"
                rows={3}
                value={s.default_meta_description}
                onChange={(e) => set('default_meta_description', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
