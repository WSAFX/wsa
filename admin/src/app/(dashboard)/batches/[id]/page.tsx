'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadMany } from '@/lib/upload';
import { thumbUrl } from '@/lib/frame';
import { DISPLAY_OPTIONS, STATUS_LABEL } from '@/lib/batch';
import ImageUpload from '@/components/ImageUpload';
import BatchDisplayPreview from '@/components/BatchDisplayPreview';
import type { Batch, BatchImage } from '@/lib/types';

type Details = Omit<Batch, 'images' | 'image_count'>;

export default function BatchEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<Details | null>(null);
  const [saved, setSaved] = useState<Details | null>(null);
  const [photos, setPhotos] = useState<BatchImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    api
      .get<Batch>(`/batches/${params.id}`)
      .then(({ images, image_count: _count, ...details }) => {
        setBatch(details);
        setSaved(details);
        setPhotos(images ?? []);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error && !batch) return <p className="text-sm text-red-600">{error}</p>;
  if (!batch) return <p className="text-sm text-gray-400">Loading…</p>;

  const dirty = JSON.stringify(batch) !== JSON.stringify(saved);
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setBatch((p) => (p ? { ...p, [k]: v } : p));

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const updated = await api.put<Details>(`/batches/${batch!.id}`, batch);
      setBatch(updated);
      setSaved(updated);
      flash('Batch saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeBatch() {
    if (!confirm(`Delete “${batch!.name}” and all ${photos.length} of its photos? This cannot be undone.`)) return;
    await api.del(`/batches/${batch!.id}`);
    router.push('/batches');
  }

  // ---- Photos (saved immediately) ----------------------------------------

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length > 100) {
      setError('Please upload at most 100 photos at a time.');
      return;
    }
    setError('');
    setProgress({ done: 0, total: files.length });
    try {
      const { uploaded, failed } = await uploadMany(files, `batches/${batch!.slug}`, (done, total) =>
        setProgress({ done, total }),
      );
      if (uploaded.length) {
        const added = await api.post<BatchImage[]>(`/batches/${batch!.id}/images`, {
          images: uploaded.map((u) => ({ image_url: u.url, public_id: u.publicId, width: u.width, height: u.height })),
        });
        setPhotos((prev) => [...prev, ...added]);
        // First upload with no featured image: use the first photo so the batch isn't blank.
        if (!batch!.featured_image_url && added[0]) set('featured_image_url', added[0].image_url);
      }
      flash(
        `${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} added.` +
          (failed.length ? ` Failed: ${failed.join(', ')}` : ''),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setProgress(null);
    }
  }

  async function persistOrder(next: BatchImage[]) {
    setPhotos(next);
    try {
      await api.put(`/batches/${batch!.id}/images-reorder`, { ids: next.map((p) => p.id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save order');
    }
  }

  function moveTo(id: string, targetId: string) {
    if (id === targetId) return;
    const next = [...photos];
    const from = next.findIndex((p) => p.id === id);
    const to = next.findIndex((p) => p.id === targetId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  }

  function nudge(idx: number, dir: -1 | 1) {
    const target = photos[idx + dir];
    if (target) moveTo(photos[idx].id, target.id);
  }

  async function saveCaption(p: BatchImage, caption: string) {
    if (caption === p.caption) return;
    setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, caption } : x)));
    await api.put(`/batches/${batch!.id}/images/${p.id}`, { caption });
  }

  async function removePhoto(p: BatchImage) {
    if (!confirm('Delete this photo?')) return;
    await api.del(`/batches/${batch!.id}/images/${p.id}`);
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    // The photo's Cloudinary asset is gone, so a featured image pointing at it would break.
    if (saved?.featured_image_url === p.image_url && !saved.featured_public_id) {
      const updated = await api.put<Details>(`/batches/${batch!.id}`, {
        ...saved,
        featured_image_url: null,
        featured_public_id: null,
      });
      setSaved(updated);
      setBatch((cur) => (cur ? { ...cur, featured_image_url: null, featured_public_id: null } : cur));
      flash('That photo was the featured image, so the featured image has been cleared.');
    } else if (batch!.featured_image_url === p.image_url) {
      set('featured_image_url', null);
    }
  }

  // A batch photo used as the featured image is referenced by URL only, so the
  // photo (not the batch) keeps ownership of the Cloudinary asset.
  function makeFeatured(p: BatchImage) {
    set('featured_image_url', p.image_url);
    set('featured_public_id', null);
  }

  return (
    <div>
      <Link href="/batches" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-primary">
        <ArrowLeft size={16} /> All batches
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{saved?.name}</h1>
        <div className="flex gap-2">
          <button onClick={removeBatch} className="btn btn-danger">
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={save} disabled={saving || !dirty} className="btn btn-primary">
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          {/* ---- Details ---- */}
          <div className="card space-y-4">
            <p className="text-sm font-bold text-brand-ink">Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Batch name</label>
                <input className="input" value={batch.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={batch.status} onChange={(e) => set('status', e.target.value as Batch['status'])}>
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start date</label>
                <input
                  type="date"
                  className="input"
                  value={batch.start_date ?? ''}
                  onChange={(e) => set('start_date', e.target.value || null)}
                />
              </div>
              <div>
                <label className="label">Graduation date</label>
                <input
                  type="date"
                  className="input"
                  value={batch.graduation_date ?? ''}
                  onChange={(e) => set('graduation_date', e.target.value || null)}
                />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                placeholder="A few words about this class: achievements, size, highlights…"
                value={batch.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
              <input type="checkbox" checked={batch.show_on_home} onChange={(e) => set('show_on_home', e.target.checked)} />
              Show on the home page (Outgoing Batch section)
            </label>
          </div>

          {/* ---- Featured image ---- */}
          <div className="card">
            <ImageUpload
              label="Featured image"
              value={batch.featured_image_url}
              folder={`batches/${batch.slug}`}
              height={160}
              onUploaded={(url, publicId) => {
                set('featured_image_url', url || null);
                set('featured_public_id', publicId || null);
              }}
            />
            <p className="mt-2 text-xs text-brand-muted">
              Usually the class group photo. You can also pick one of the photos below with the ★ button.
            </p>
          </div>

          {/* ---- Photos ---- */}
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-brand-ink">Photos ({photos.length})</p>
                <p className="text-xs text-brand-muted">Saved instantly. Drag or use the arrows to reorder.</p>
              </div>
              <label className={`btn btn-primary cursor-pointer ${progress ? 'pointer-events-none opacity-70' : ''}`}>
                <Upload size={16} />
                {progress ? `Uploading ${progress.done}/${progress.total}…` : 'Upload photos'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={!!progress} />
              </label>
            </div>

            {photos.length === 0 ? (
              <p className="rounded-xl bg-brand-bg py-10 text-center text-sm text-brand-muted">
                No photos yet. You can select many at once.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p, idx) => {
                  const isFeatured = batch.featured_image_url === p.image_url;
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => (dragId.current = p.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragId.current) moveTo(dragId.current, p.id);
                        dragId.current = null;
                      }}
                      className={`cursor-grab rounded-lg bg-brand-bg p-1.5 active:cursor-grabbing ${isFeatured ? 'ring-2 ring-brand-gold' : ''}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(p.image_url, 300)} alt="" className="aspect-square w-full rounded-md object-cover" />
                      <input
                        className="mt-1.5 w-full rounded border-0 bg-white px-2 py-1 text-xs outline-none ring-1 ring-black/5 focus:ring-brand-primary"
                        placeholder="Caption"
                        defaultValue={p.caption}
                        onBlur={(e) => saveCaption(p, e.target.value)}
                      />
                      <div className="mt-1 flex items-center justify-between text-gray-400">
                        <div className="flex">
                          <button type="button" aria-label="Move left" disabled={idx === 0} onClick={() => nudge(idx, -1)} className="p-1 hover:text-brand-primary disabled:opacity-30">
                            <ArrowLeft size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label="Move right"
                            disabled={idx === photos.length - 1}
                            onClick={() => nudge(idx, 1)}
                            className="p-1 hover:text-brand-primary disabled:opacity-30"
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                        <div className="flex">
                          <button
                            type="button"
                            title="Use as featured image"
                            aria-label="Use as featured image"
                            onClick={() => makeFeatured(p)}
                            className={`p-1 ${isFeatured ? 'text-brand-gold' : 'hover:text-brand-gold'}`}
                          >
                            <Star size={13} fill={isFeatured ? 'currentColor' : 'none'} />
                          </button>
                          <button type="button" aria-label="Delete photo" onClick={() => removePhoto(p)} className="p-1 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---- Display mode + preview ---- */}
        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="card space-y-3 p-5">
            <p className="text-sm font-bold text-brand-ink">How it looks on the website</p>
            <div className="grid grid-cols-2 gap-2">
              {DISPLAY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('display_mode', o.value)}
                  className={`rounded-xl p-3 text-left ring-1 transition ${
                    batch.display_mode === o.value ? 'bg-brand-primary/5 ring-2 ring-brand-primary' : 'ring-black/10 hover:ring-brand-primary/50'
                  }`}
                >
                  <p className="text-sm font-semibold text-brand-ink">{o.label}</p>
                  <p className="text-[11px] leading-snug text-brand-muted">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">Preview</p>
            <BatchDisplayPreview mode={batch.display_mode} featured={batch.featured_image_url} photos={photos} name={batch.name} />
            {dirty && <p className="mt-3 text-xs text-amber-600">Unsaved changes. Click “Save changes” to publish.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
