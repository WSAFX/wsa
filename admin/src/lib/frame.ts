import type { AspectRatio, CropMode, FrameStyle, Gravity } from './types';

/**
 * Auto-framing via Cloudinary URL transforms — the original upload is never modified.
 *  - fill: c_fill + g_auto → AI subject/face-aware crop to the exact frame shape
 *  - pad:  c_pad + b_auto  → whole photo visible, gaps filled with a colour sampled from the image
 * Keep in sync with users/src/lib/frame.ts.
 */
export interface FrameOptions {
  aspect: AspectRatio;
  crop: CropMode;
  gravity?: Gravity;
  width?: number;
}

export function framedUrl(url: string, { aspect, crop, gravity = 'auto', width = 800 }: FrameOptions): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const ar = `ar_${aspect}`;
  const t =
    crop === 'pad'
      ? `c_pad,b_auto,${ar},w_${width}`
      : `c_fill,g_${gravity},${ar},w_${width}`;
  return url.replace('/upload/', `/upload/${t},f_auto,q_auto/`);
}

/** Resize only, keeping the photo's natural shape (used by masonry layouts). */
export function fitUrl(url: string, width = 800): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_limit,w_${width},f_auto,q_auto/`);
}

/** Small square thumbnail for admin lists. */
export function thumbUrl(url: string, size = 240): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_fill,g_auto,w_${size},h_${size},f_auto,q_auto/`);
}

/** CSS aspect-ratio value from "4:3". */
export const cssAspect = (aspect: AspectRatio) => aspect.replace(':', ' / ');

/** Tailwind classes for the outer frame + inner image of each frame style. */
export const FRAME_CLASSES: Record<FrameStyle, { outer: string; inner: string }> = {
  none: { outer: '', inner: '' },
  rounded: { outer: 'overflow-hidden rounded-xl', inner: '' },
  polaroid: { outer: 'bg-white p-2 pb-8 shadow-md ring-1 ring-black/5 rotate-0', inner: '' },
  gold: { outer: 'rounded-lg bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 p-1.5 shadow-md', inner: 'rounded-md' },
  shadow: { outer: 'overflow-hidden rounded-lg shadow-xl shadow-black/25', inner: '' },
};

export const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Landscape (4:3)' },
  { value: '3:2', label: 'Photo (3:2)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '3:4', label: 'Portrait (3:4)' },
];

export const FRAME_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'gold', label: 'Gold border' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'none', label: 'None' },
];

export const GRAVITY_OPTIONS: { value: Gravity; label: string }[] = [
  { value: 'auto', label: 'Auto (AI subject)' },
  { value: 'faces', label: 'All faces' },
  { value: 'face', label: 'Main face' },
  { value: 'center', label: 'Centre' },
];
