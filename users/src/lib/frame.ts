import type { AspectRatio, CropMode, FrameStyle, Gravity } from '../types';

/**
 * Auto-framing via Cloudinary URL transforms — the original upload is never modified.
 *  - fill: c_fill + g_auto → AI subject/face-aware crop to the exact frame shape
 *  - pad:  c_pad + b_auto  → whole photo visible, gaps filled with a colour sampled from the image
 * Keep in sync with admin/src/lib/frame.ts.
 */
const isCloudinary = (url: string) => !!url && url.includes('res.cloudinary.com') && url.includes('/upload/');

export function framedUrl(
  url: string,
  { aspect, crop, gravity = 'auto', width = 800 }: { aspect: AspectRatio; crop: CropMode; gravity?: Gravity; width?: number },
): string {
  if (!isCloudinary(url)) return url;
  const t = crop === 'pad' ? `c_pad,b_auto,ar_${aspect},w_${width}` : `c_fill,g_${gravity},ar_${aspect},w_${width}`;
  return url.replace('/upload/', `/upload/${t},f_auto,q_auto/`);
}

/** Resize only, keeping the photo's natural shape (masonry, lightbox). */
export function fitUrl(url: string, width = 1600): string {
  if (!isCloudinary(url)) return url;
  return url.replace('/upload/', `/upload/c_limit,w_${width},f_auto,q_auto/`);
}

/** responsive srcSet for a framed image */
export function framedSrcSet(url: string, opts: { aspect: AspectRatio; crop: CropMode; gravity?: Gravity }): string | undefined {
  if (!isCloudinary(url)) return undefined;
  return [400, 800, 1200].map((w) => `${framedUrl(url, { ...opts, width: w })} ${w}w`).join(', ');
}

export const cssAspect = (aspect: AspectRatio) => aspect.replace(':', ' / ');

export const FRAME_CLASSES: Record<FrameStyle, { outer: string; inner: string }> = {
  none: { outer: '', inner: '' },
  rounded: { outer: 'overflow-hidden rounded-2xl', inner: '' },
  polaroid: { outer: 'bg-white p-2.5 pb-10 shadow-lg ring-1 ring-black/5', inner: '' },
  gold: {
    outer: 'rounded-xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 p-1.5 shadow-lg shadow-accent-500/20',
    inner: 'rounded-lg',
  },
  shadow: { outer: 'overflow-hidden rounded-xl shadow-2xl shadow-black/40', inner: '' },
};
