'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Home, Images, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { thumbUrl } from '@/lib/frame';
import { STATUS_LABEL, DISPLAY_LABEL } from '@/lib/batch';
import type { Batch } from '@/lib/types';

export default function BatchesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Batch[] | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Batch[]>('/batches')
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const b = await api.post<Batch>('/batches', { name: name.trim(), status: 'outgoing' });
      router.push(`/batches/${b.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create batch');
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Batches</h1>
      <p className="page-subtitle">
        Showcase each class. Mark a batch “Show on home page” to feature it in the Outgoing Batch section.
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={create} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row">
        <input
          className="input"
          placeholder="New batch name, e.g. Batch 14 · September 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={creating || !name.trim()} className="btn btn-primary shrink-0">
          <Plus size={16} /> {creating ? 'Creating…' : 'Create batch'}
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows === null && <p className="text-sm text-gray-400">Loading…</p>}
        {rows?.length === 0 && (
          <p className="card col-span-full text-sm text-brand-muted">No batches yet. Create one above.</p>
        )}
        {rows?.map((b) => (
          <Link
            key={b.id}
            href={`/batches/${b.id}`}
            className="card group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="aspect-[16/10] bg-brand-bg">
              {b.featured_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(b.featured_image_url, 600)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-brand-muted">
                  <GraduationCap size={32} />
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <p className="font-semibold text-brand-ink group-hover:text-brand-primary">{b.name}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className={`badge ${b.status === 'outgoing' ? 'badge-gold' : b.status === 'current' ? 'badge-green' : 'badge-gray'}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                {b.show_on_home && (
                  <span className="badge bg-blue-100 text-blue-700">
                    <Home size={12} /> On home page
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                <Images size={13} /> {b.image_count ?? 0} photos · {DISPLAY_LABEL[b.display_mode]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
