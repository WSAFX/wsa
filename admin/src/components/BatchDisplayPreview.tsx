'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fitUrl, framedUrl } from '@/lib/frame';
import type { BatchDisplayMode } from '@/lib/types';

interface Photo {
  image_url: string;
  caption?: string;
}

/**
 * Small-scale version of users/src/components/OutgoingBatch.tsx so the admin can
 * compare display modes with the batch's real photos before saving.
 */
export default function BatchDisplayPreview({
  mode,
  featured,
  photos,
  name,
}: {
  mode: BatchDisplayMode;
  featured: string | null;
  photos: Photo[];
  name: string;
}) {
  const hero = featured ?? photos[0]?.image_url ?? null;
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [mode, photos.length]);

  useEffect(() => {
    if (mode !== 'slider' || photos.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % photos.length), 3000);
    return () => clearInterval(t);
  }, [mode, photos.length]);

  if (!hero) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-brand-bg text-sm text-brand-muted">
        Add a featured image or photos to see the preview.
      </div>
    );
  }

  const Banner = (
    <div className="relative overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={framedUrl(hero, { aspect: '16:9', crop: 'fill', width: 700 })} alt="" className="aspect-video w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-3 left-4 text-sm font-bold text-white">{name || 'Batch name'}</p>
    </div>
  );

  if (mode === 'featured_thumbs') {
    const list = [hero, ...photos.map((p) => p.image_url).filter((u) => u !== hero)];
    const current = list[i] ?? hero;
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={framedUrl(current, { aspect: '16:9', crop: 'fill', width: 700 })} alt="" className="aspect-video w-full object-cover" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((u, idx) => (
            <button
              key={u + idx}
              type="button"
              onClick={() => setI(idx)}
              className={`shrink-0 overflow-hidden rounded-md ring-2 ${idx === i ? 'ring-brand-primary' : 'ring-transparent opacity-70'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={framedUrl(u, { aspect: '1:1', crop: 'fill', width: 120 })} alt="" className="h-12 w-12 object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'slider') {
    const current = photos[i];
    return (
      <div className="space-y-2">
        {Banner}
        {current && (
          <div className="relative overflow-hidden rounded-xl bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.image_url}
              src={framedUrl(current.image_url, { aspect: '3:2', crop: 'pad', width: 700 })}
              alt=""
              className="aspect-[3/2] w-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setI((n) => (n - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setI((n) => (n + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {photos.map((_, idx) => (
                    <span key={idx} className={`h-1.5 rounded-full ${idx === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'grid') {
    return (
      <div className="space-y-2">
        {Banner}
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 9).map((p, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.image_url + idx}
              src={framedUrl(p.image_url, { aspect: '1:1', crop: 'fill', width: 240 })}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </div>
    );
  }

  // masonry
  return (
    <div className="space-y-2">
      {Banner}
      <div className="columns-3 gap-2 [&>*]:mb-2">
        {photos.slice(0, 12).map((p, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.image_url + idx} src={fitUrl(p.image_url, 300)} alt="" className="w-full break-inside-avoid rounded-lg" />
        ))}
      </div>
    </div>
  );
}
