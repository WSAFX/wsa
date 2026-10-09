import { cssAspect, fitUrl, framedSrcSet, framedUrl, FRAME_CLASSES } from '../lib/frame';
import type { AspectRatio, CropMode, FrameStyle, Gravity } from '../types';

interface Props {
  src: string;
  alt: string;
  aspect: AspectRatio;
  crop: CropMode;
  gravity?: Gravity;
  frame: FrameStyle;
  /** keep the natural shape (masonry) instead of cropping to `aspect` */
  natural?: boolean;
  caption?: string;
  sizes?: string;
  imgClassName?: string;
}

/** An auto-framed photo. Same rendering as the admin preview (admin/src/components/FramedImage.tsx). */
const FramedPhoto = ({ src, alt, aspect, crop, gravity, frame, natural, caption, sizes, imgClassName = '' }: Props) => {
  const f = FRAME_CLASSES[frame];
  return (
    <figure className={`relative ${f.outer}`}>
      <img
        src={natural ? fitUrl(src, 800) : framedUrl(src, { aspect, crop, gravity })}
        srcSet={natural ? undefined : framedSrcSet(src, { aspect, crop, gravity })}
        sizes={sizes ?? '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block w-full ${natural ? 'h-auto' : 'object-cover'} ${f.inner} ${imgClassName}`}
        style={natural ? undefined : { aspectRatio: cssAspect(aspect) }}
      />
      {frame === 'polaroid' && caption && (
        <figcaption className="absolute bottom-2.5 left-3 right-3 truncate text-center font-display text-sm text-slate-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default FramedPhoto;
