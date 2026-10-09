'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, GripVertical, Trash2, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadMany } from '@/lib/upload';
import FramedImage from '@/components/FramedImage';
import { ASPECT_OPTIONS, FRAME_OPTIONS, GRAVITY_OPTIONS } from '@/lib/frame';
import type { GalleryCategory, GalleryImage, GallerySettings } from '@/lib/types';

interface GalleryData {
  settings: GallerySettings;
  categories: GalleryCategory[];
  images: GalleryImage[];
}

const ALL = '__all__';
const NONE = '__none__';

export default function GalleryPage() {
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filter, setFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const d = await api.get<GalleryData>('/gallery');
      setSettings(d.settings);
      setCategories(d.categories);
      setImages(d.images);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load gallery');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === ALL) return images;
    if (filter === NONE) return images.filter((i) => !i.category_id);
    return images.filter((i) => i.category_id === filter);
  }, [images, filter]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  }

  // ---- Reordering (drag & drop on desktop, arrows everywhere) --------------
  const dragId = useRef<string | null>(null);

  async function persistOrder(next: GalleryImage[]) {
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
    try {
      await api.put('/gallery/reorder', { ids: next.map((i) => i.id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save order');
      load();
    }
  }

  function moveTo(id: string, targetId: string) {
    if (id === targetId) return;
    const next = [...images];
    const from = next.findIndex((i) => i.id === id);
    const to = next.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  }

  function nudge(id: string, dir: -1 | 1) {
    // Move within the currently visible (possibly filtered) list.
    const idx = visible.findIndex((i) => i.id === id);
    const neighbour = visible[idx + dir];
    if (neighbour) moveTo(id, neighbour.id);
  }

  // ---- Image updates -----------------------------------------------------
  async function patchImage(id: string, patch: Partial<GalleryImage>) {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setEditing((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    try {
      await api.put(`/gallery/images/${id}`, patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      load();
    }
  }

  async function removeImage(id: string) {
    if (!confirm('Delete this photo? It will also be removed from Cloudinary.')) return;
    await api.del(`/gallery/images/${id}`);
    setImages((prev) => prev.filter((i) => i.id !== id));
    setEditing(null);
    flash('Photo deleted.');
  }

  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Gallery</h1>
          <p className="page-subtitle">
            Photos are framed automatically: Cloudinary finds the people in each shot and crops around them.
          </p>
        </div>
        <UploadButton
          categories={categories}
          defaultCategory={filter !== ALL && filter !== NONE ? filter : ''}
          onDone={(added, failed) => {
            setImages((prev) => [...prev, ...added]);
            flash(
              `${added.length} photo${added.length === 1 ? '' : 's'} added.` +
                (failed.length ? ` ${failed.length} failed: ${failed.join(', ')}` : ''),
            );
          }}
          onError={setError}
        />
      </div>

      {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ---- Photos ---- */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={filter === ALL} onClick={() => setFilter(ALL)}>
              All ({images.length})
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.name} ({images.filter((i) => i.category_id === c.id).length})
              </FilterChip>
            ))}
            {images.some((i) => !i.category_id) && (
              <FilterChip active={filter === NONE} onClick={() => setFilter(NONE)}>
                Uncategorised
              </FilterChip>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="card text-sm text-gray-400">No photos here yet. Use “Upload photos” to add some.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {visible.map((img, idx) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => (dragId.current = img.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragId.current) moveTo(dragId.current, img.id);
                    dragId.current = null;
                  }}
                  className={`group relative cursor-grab rounded-xl bg-white p-2 shadow-soft ring-1 ring-black/5 active:cursor-grabbing ${
                    img.active ? '' : 'opacity-50'
                  }`}
                >
                  <button type="button" onClick={() => setEditing(img)} className="block w-full text-left">
                    <FramedImage
                      src={img.image_url}
                      alt={img.alt}
                      aspect={settings.aspect_ratio}
                      crop={img.crop_mode ?? settings.crop_mode}
                      gravity={img.gravity}
                      frame={img.frame_style ?? settings.frame_style}
                      caption={img.caption}
                      width={400}
                    />
                  </button>
                  <p className="mt-2 truncate px-1 text-xs text-brand-muted" title={img.caption}>
                    {img.caption || <span className="italic text-gray-300">No caption</span>}
                  </p>
                  <div className="mt-1 flex items-center justify-between px-1 text-gray-400">
                    <GripVertical size={14} className="hidden sm:block" />
                    <div className="flex items-center gap-1">
                      <IconBtn label="Move left" disabled={idx === 0} onClick={() => nudge(img.id, -1)}>
                        <ArrowLeft size={14} />
                      </IconBtn>
                      <IconBtn label="Move right" disabled={idx === visible.length - 1} onClick={() => nudge(img.id, 1)}>
                        <ArrowRight size={14} />
                      </IconBtn>
                      <IconBtn
                        label={img.active ? 'Hide from site' : 'Show on site'}
                        onClick={() => patchImage(img.id, { active: !img.active })}
                      >
                        {img.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </IconBtn>
                    </div>
                  </div>
                  {(img.crop_mode || img.frame_style) && (
                    <span className="badge badge-gold absolute left-3 top-3 text-[10px]">Custom framing</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Side panel: display settings + categories ---- */}
        <div className="space-y-6">
          <DisplaySettings
            value={settings}
            onSaved={(s) => {
              setSettings(s);
              flash('Display settings saved.');
            }}
            onError={setError}
          />
          <CategoryManager categories={categories} onChange={setCategories} onError={setError} reload={load} />
        </div>
      </div>

      {editing && (
        <EditDrawer
          image={editing}
          settings={settings}
          categories={categories}
          onPatch={(patch) => patchImage(editing.id, patch)}
          onDelete={() => removeImage(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'bg-brand-primary text-white' : 'bg-white text-brand-muted ring-1 ring-black/10 hover:text-brand-ink'
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 hover:bg-brand-bg hover:text-brand-primary disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function UploadButton({
  categories,
  defaultCategory,
  onDone,
  onError,
}: {
  categories: GalleryCategory[];
  defaultCategory: string;
  onDone: (added: GalleryImage[], failed: string[]) => void;
  onError: (msg: string) => void;
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => setCategory(defaultCategory), [defaultCategory]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length > 50) {
      onError('Please upload at most 50 photos at a time.');
      return;
    }
    setProgress({ done: 0, total: files.length });
    try {
      const { uploaded, failed } = await uploadMany(files, 'gallery', (done, total) => setProgress({ done, total }));
      if (uploaded.length) {
        const added = await api.post<GalleryImage[]>('/gallery/images/bulk', {
          images: uploaded.map((u) => ({
            image_url: u.url,
            public_id: u.publicId,
            width: u.width,
            height: u.height,
            category_id: category || null,
          })),
        });
        onDone(added, failed);
      } else {
        onError(`Upload failed for: ${failed.join(', ')}`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="input w-auto py-2"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Category for new photos"
      >
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <label className={`btn btn-primary cursor-pointer ${progress ? 'pointer-events-none opacity-70' : ''}`}>
        <Upload size={16} />
        {progress ? `Uploading ${progress.done}/${progress.total}…` : 'Upload photos'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={!!progress} />
      </label>
    </div>
  );
}

function DisplaySettings({
  value,
  onSaved,
  onError,
}: {
  value: GallerySettings;
  onSaved: (s: GallerySettings) => void;
  onError: (msg: string) => void;
}) {
  const [s, setS] = useState(value);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(value);

  useEffect(() => setS(value), [value]);

  async function save() {
    setSaving(true);
    try {
      onSaved(await api.put<GallerySettings>('/gallery/settings', s));
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof GallerySettings>(k: K, v: GallerySettings[K]) => setS((p) => ({ ...p, [k]: v }));

  return (
    <div className="card space-y-4 p-5">
      <p className="text-sm font-bold text-brand-ink">Display on the website</p>

      <div>
        <label className="label">Layout</label>
        <div className="grid grid-cols-2 gap-2">
          {(['grid', 'masonry'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set('layout', l)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 ${
                s.layout === l ? 'bg-brand-primary text-white ring-brand-primary' : 'ring-black/10 hover:ring-brand-primary'
              }`}
            >
              {l === 'grid' ? 'Even grid' : 'Masonry'}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-brand-muted">
          {s.layout === 'grid'
            ? 'Every photo is framed to the same shape.'
            : 'Photos keep their natural shape and stack like Pinterest.'}
        </p>
      </div>

      {s.layout === 'grid' && (
        <>
          <div>
            <label className="label">Frame shape</label>
            <select className="input" value={s.aspect_ratio} onChange={(e) => set('aspect_ratio', e.target.value as GallerySettings['aspect_ratio'])}>
              {ASPECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Auto-framing</label>
            <select className="input" value={s.crop_mode} onChange={(e) => set('crop_mode', e.target.value as GallerySettings['crop_mode'])}>
              <option value="fill">Smart fill: crop around people</option>
              <option value="pad">Fit: show whole photo, pad edges</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="label">Frame style</label>
        <select className="input" value={s.frame_style} onChange={(e) => set('frame_style', e.target.value as GallerySettings['frame_style'])}>
          {FRAME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Columns on desktop ({s.columns})</label>
        <input
          type="range"
          min={2}
          max={5}
          step={1}
          value={s.columns}
          onChange={(e) => set('columns', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button onClick={save} disabled={!dirty || saving} className="btn btn-primary w-full">
        {saving ? 'Saving…' : dirty ? 'Save display settings' : 'Saved'}
      </button>
    </div>
  );
}

function CategoryManager({
  categories,
  onChange,
  onError,
  reload,
}: {
  categories: GalleryCategory[];
  onChange: (c: GalleryCategory[]) => void;
  onError: (msg: string) => void;
  reload: () => void;
}) {
  const [name, setName] = useState('');

  async function add() {
    if (!name.trim()) return;
    try {
      const created = await api.post<GalleryCategory>('/gallery/categories', {
        name: name.trim(),
        sort_order: categories.length,
      });
      onChange([...categories, { ...created, image_count: 0 }]);
      setName('');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add category');
    }
  }

  async function rename(c: GalleryCategory) {
    const next = prompt('Rename category', c.name);
    if (!next || next.trim() === c.name) return;
    try {
      const updated = await api.put<GalleryCategory>(`/gallery/categories/${c.id}`, {
        name: next.trim(),
        sort_order: c.sort_order,
      });
      onChange(categories.map((x) => (x.id === c.id ? { ...x, ...updated } : x)));
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Rename failed');
    }
  }

  async function remove(c: GalleryCategory) {
    if (!confirm(`Delete “${c.name}”? Its photos stay in the gallery as uncategorised.`)) return;
    await api.del(`/gallery/categories/${c.id}`);
    reload();
  }

  return (
    <div className="card space-y-3 p-5">
      <p className="text-sm font-bold text-brand-ink">Categories</p>
      <p className="text-xs text-brand-muted">Shown as filter tabs above the gallery.</p>
      <ul className="divide-y divide-black/5">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
            <button type="button" className="flex-1 text-left hover:text-brand-primary" onClick={() => rename(c)}>
              {c.name}
            </button>
            <span className="text-xs text-brand-muted">{c.image_count ?? 0}</span>
            <button type="button" aria-label={`Delete ${c.name}`} onClick={() => remove(c)} className="text-gray-300 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input py-2"
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" onClick={add} className="btn btn-ghost py-2">
          Add
        </button>
      </div>
    </div>
  );
}

function EditDrawer({
  image,
  settings,
  categories,
  onPatch,
  onDelete,
  onClose,
}: {
  image: GalleryImage;
  settings: GallerySettings;
  categories: GalleryCategory[];
  onPatch: (patch: Partial<GalleryImage>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [alt, setAlt] = useState(image.alt);

  useEffect(() => {
    setCaption(image.caption);
    setAlt(image.alt);
  }, [image.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const crop = image.crop_mode ?? settings.crop_mode;
  const frame = image.frame_style ?? settings.frame_style;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <p className="font-semibold text-brand-ink">Edit photo</p>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-brand-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label">Original</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.image_url} alt="" className="w-full rounded-lg bg-gray-100 object-contain" style={{ maxHeight: 180 }} />
              {image.width && image.height && (
                <p className="mt-1 text-[11px] text-brand-muted">
                  {image.width} × {image.height}px
                </p>
              )}
            </div>
            <div>
              <p className="label">On the website</p>
              <FramedImage
                src={image.image_url}
                aspect={settings.aspect_ratio}
                crop={crop}
                gravity={image.gravity}
                frame={frame}
                caption={caption}
                natural={settings.layout === 'masonry'}
                width={400}
              />
            </div>
          </div>

          <div>
            <label className="label">Caption</label>
            <input
              className="input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={() => caption !== image.caption && onPatch({ caption })}
            />
          </div>
          <div>
            <label className="label">Alt text (for SEO & screen readers)</label>
            <input
              className="input"
              value={alt}
              placeholder="Describe what is in the photo"
              onChange={(e) => setAlt(e.target.value)}
              onBlur={() => alt !== image.alt && onPatch({ alt })}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={image.category_id ?? ''}
              onChange={(e) => onPatch({ category_id: e.target.value || null })}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-brand-bg p-4">
            <p className="text-sm font-bold text-brand-ink">Framing for this photo</p>
            <p className="mb-3 text-xs text-brand-muted">Leave on “Gallery default” unless this photo crops badly.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Auto-framing</label>
                <select
                  className="input"
                  value={image.crop_mode ?? ''}
                  onChange={(e) => onPatch({ crop_mode: (e.target.value || null) as GalleryImage['crop_mode'] })}
                >
                  <option value="">Gallery default ({settings.crop_mode === 'fill' ? 'smart fill' : 'fit'})</option>
                  <option value="fill">Smart fill: crop around people</option>
                  <option value="pad">Fit: show whole photo</option>
                </select>
              </div>
              {crop === 'fill' && (
                <div>
                  <label className="label">Focus on</label>
                  <select
                    className="input"
                    value={image.gravity}
                    onChange={(e) => onPatch({ gravity: e.target.value as GalleryImage['gravity'] })}
                  >
                    {GRAVITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Frame style</label>
                <select
                  className="input"
                  value={image.frame_style ?? ''}
                  onChange={(e) => onPatch({ frame_style: (e.target.value || null) as GalleryImage['frame_style'] })}
                >
                  <option value="">Gallery default ({settings.frame_style})</option>
                  {FRAME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
            <input type="checkbox" checked={image.active} onChange={(e) => onPatch({ active: e.target.checked })} />
            Show on the website
          </label>

          <button type="button" onClick={onDelete} className="btn btn-danger w-full">
            <Trash2 size={16} /> Delete photo
          </button>
        </div>
      </aside>
    </div>
  );
}
