'use client';

import { X } from 'lucide-react';
import type { AnnouncementLayout } from '@/lib/types';

export interface AnnouncementPreviewData {
  title: string;
  body_html: string;
  image_url: string | null;
  layout: AnnouncementLayout;
  cta_label: string;
  cta_href: string;
}

/**
 * Mirrors users/src/components/AnnouncementModal.tsx so the admin sees exactly
 * what visitors will get. Rendered inline (not fixed) inside a fake backdrop.
 */
export default function AnnouncementPreview({ a, device = 'desktop' }: { a: AnnouncementPreviewData; device?: 'desktop' | 'mobile' }) {
  const hasImage = !!a.image_url;
  const layout = hasImage ? a.layout : 'image_top';
  const mobile = device === 'mobile';
  const side = layout === 'image_left' && !mobile;

  const body = (
    <>
      <h2 className={`font-bold leading-tight ${layout === 'image_background' ? 'text-white' : 'text-slate-900'} ${mobile ? 'text-xl' : 'text-2xl'}`}>
        {a.title || 'Announcement title'}
      </h2>
      {a.body_html && (
        <div
          className={`announcement-body mt-3 text-sm leading-relaxed ${
            layout === 'image_background' ? 'text-white/90' : 'text-slate-600'
          }`}
          dangerouslySetInnerHTML={{ __html: a.body_html }}
        />
      )}
      {a.cta_label && (
        <span className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          {a.cta_label}
        </span>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-center rounded-2xl bg-slate-900/70 p-6" style={{ minHeight: 360 }}>
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${
          mobile ? 'max-w-[320px]' : side ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <span className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
          <X size={16} />
        </span>

        {layout === 'image_background' ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/30" />
            <div className={`relative flex min-h-[340px] flex-col justify-end ${mobile ? 'p-5' : 'p-8'}`}>{body}</div>
          </div>
        ) : side ? (
          <div className="grid grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image_url!} alt="" className="h-full max-h-[420px] w-full object-cover" />
            <div className="max-h-[420px] overflow-y-auto p-7">{body}</div>
          </div>
        ) : (
          <div>
            {hasImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.image_url!} alt="" className="max-h-64 w-full object-cover" />
            )}
            <div className={mobile ? 'p-5' : 'p-7'}>{body}</div>
          </div>
        )}
      </div>
    </div>
  );
}
