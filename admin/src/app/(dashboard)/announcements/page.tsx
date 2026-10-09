'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Announcement } from '@/lib/types';

type Row = Pick<Announcement, 'id' | 'title' | 'image_url' | 'layout' | 'is_active' | 'starts_at' | 'ends_at' | 'updated_at'>;

function scheduleNote(a: Row): string | null {
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) {
    return `Starts ${new Date(a.starts_at).toLocaleString()}`;
  }
  if (a.ends_at) {
    const end = new Date(a.ends_at).getTime();
    return end <= now ? 'Schedule ended, not showing' : `Ends ${new Date(a.ends_at).toLocaleString()}`;
  }
  return null;
}

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setRows(await api.get<Row[]>('/announcements'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(a: Row) {
    setError('');
    try {
      await api.patch(`/announcements/${a.id}/active`, { is_active: !a.is_active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function remove(a: Row) {
    if (!confirm(`Delete “${a.title}”?`)) return;
    await api.del(`/announcements/${a.id}`);
    setRows((prev) => prev?.filter((r) => r.id !== a.id) ?? null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">The live announcement pops up each time someone opens the website.</p>
        </div>
        <Link href="/announcements/new" className="btn btn-primary">
          <Plus size={16} /> New announcement
        </Link>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {rows === null && <p className="text-sm text-gray-400">Loading…</p>}
        {rows?.length === 0 && (
          <div className="card flex flex-col items-center gap-3 py-12 text-center">
            <Megaphone className="text-brand-muted" />
            <p className="text-sm text-brand-muted">No announcements yet.</p>
            <Link href="/announcements/new" className="btn btn-primary">
              Create your first announcement
            </Link>
          </div>
        )}
        {rows?.map((a) => {
          const note = scheduleNote(a);
          return (
            <div
              key={a.id}
              className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${a.is_active ? 'ring-2 ring-green-400' : ''}`}
            >
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-bg">
                {a.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-muted">
                    <Megaphone size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/announcements/${a.id}`} className="font-semibold text-brand-ink hover:text-brand-primary">
                  {a.title}
                </Link>
                <p className="text-xs text-brand-muted">
                  Updated {new Date(a.updated_at).toLocaleDateString()}
                  {note ? ` · ${note}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <span className={a.is_active ? 'text-green-700' : 'text-brand-muted'}>{a.is_active ? 'Live' : 'Off'}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={a.is_active}
                    aria-label={a.is_active ? 'Turn off' : 'Go live'}
                    onClick={() => toggle(a)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${a.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        a.is_active ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
                <Link href={`/announcements/${a.id}`} className="text-sm font-semibold text-brand-primary">
                  Edit
                </Link>
                <button onClick={() => remove(a)} className="text-sm text-gray-400 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
