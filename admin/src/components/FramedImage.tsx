'use client';

import { cssAspect, fitUrl, framedUrl, FRAME_CLASSES } from '@/lib/frame';
import type { AspectRatio, CropMode, FrameStyle, Gravity } from '@/lib/types';

interface Props {
  src: string;
  alt?: string;
  aspect: AspectRatio;
  crop: CropMode;
  gravity?: Gravity;
  frame: FrameStyle;
  width?: number;
  caption?: string;
  /** masonry: keep the photo's natural shape (no crop), frame still applies */
  natural?: boolean;
  className?: string;
}

/** Same rendering the public site uses, so the admin preview is what visitors get. */
export default function FramedImage({
  src,
  alt = '',
  aspect,
  crop,
  gravity,
  frame,
  width = 600,
  caption,
  natural,
  className = '',
}: Props) {
  const f = FRAME_CLASSES[frame];
  const url = natural ? fitUrl(src, width) : framedUrl(src, { aspect, crop, gravity, width });

  return (
    <figure className={`${f.outer} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`block w-full ${natural ? 'h-auto' : 'h-full object-cover'} ${f.inner}`}
        style={natural ? undefined : { aspectRatio: cssAspect(aspect) }}
      />
      {frame === 'polaroid' && caption && (
        <figcaption className="mt-2 truncate text-center font-serif text-xs text-gray-600">{caption}</figcaption>
      )}
    </figure>
  );
}
