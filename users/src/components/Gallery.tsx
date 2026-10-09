import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { GALLERY_IMAGES } from '../data/constants';
import { useApi } from '../hooks/useApi';
import { fitUrl } from '../lib/frame';
import FramedPhoto from './FramedPhoto';
import type { GalleryData, GalleryPhoto, GallerySettings } from '../types';

const DEFAULT_SETTINGS: GallerySettings = {
  aspect_ratio: '4:3',
  crop_mode: 'fill',
  frame_style: 'rounded',
  layout: 'grid',
  columns: 3,
};

// Static photos from before the CMS — shown only if the API is unreachable.
const FALLBACK: GalleryData = {
  settings: DEFAULT_SETTINGS,
  categories: [
    { id: 'classroom', name: 'Classroom', slug: 'classroom' },
    { id: 'events', name: 'Events', slug: 'events' },
    { id: 'graduation', name: 'Graduation', slug: 'graduation' },
    { id: 'workshop', name: 'Workshops', slug: 'workshop' },
  ],
  images: GALLERY_IMAGES.map((img) => ({
    id: String(img.id),
    image_url: img.src,
    width: null,
    height: null,
    caption: img.caption,
    alt: img.caption,
    crop_mode: null,
    gravity: 'auto',
    frame_style: null,
    category_slug: img.category,
    category_name: img.category,
  })),
};

// Literal class names so Tailwind generates them.
const GRID_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};
const MASONRY_COLS: Record<number, string> = {
  2: 'lg:columns-2',
  3: 'lg:columns-3',
  4: 'lg:columns-4',
  5: 'lg:columns-5',
};

// Each photo flies in from a different side, with a little spin.
const FLY_FROM = [
  { x: -140, y: 40, rotate: -12 },
  { x: 0, y: 140, rotate: 6 },
  { x: 140, y: 40, rotate: 12 },
  { x: 0, y: -120, rotate: -6 },
];

const Gallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { data: live, loading, error } = useApi<GalleryData>('/gallery');
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const data = live ?? (error ? FALLBACK : null);
  const settings = data?.settings ?? DEFAULT_SETTINGS;

  // Only offer filter tabs for categories that actually have photos.
  const categories = useMemo(() => {
    if (!data) return [];
    const used = new Set(data.images.map((i) => i.category_slug));
    return data.categories.filter((c) => used.has(c.slug));
  }, [data]);

  const images = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data.images : data.images.filter((img) => img.category_slug === filter);
  }, [data, filter]);

  const current: GalleryPhoto | null = selected !== null ? images[selected] ?? null : null;

  const step = useCallback(
    (dir: -1 | 1) => setSelected((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, step]);

  if (!loading && data && data.images.length === 0) return null;

  const masonry = settings.layout === 'masonry';

  return (
    <section id="gallery" className="relative py-24 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 dark:via-primary-950/10 light:via-primary-50/30 to-transparent" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium mb-4">
            <Camera className="w-4 h-4" />
            Our Gallery
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-adaptive mb-6">
            Moments of <span className="gradient-text">Excellence</span>
          </h2>
          <p className="text-xl text-adaptive-secondary max-w-3xl mx-auto">
            Glimpses of our vibrant community, classroom sessions, and success celebrations
          </p>
        </motion.div>

        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {[{ slug: 'all', name: 'All' }, ...categories].map((category) => (
              <button
                key={category.slug}
                onClick={() => setFilter(category.slug)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  filter === category.slug
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-primary-500/10 border border-primary-500/20 text-adaptive-secondary hover:text-adaptive hover:border-primary-500/40'
                }`}
                aria-pressed={filter === category.slug}
              >
                {category.name}
              </button>
            ))}
          </motion.div>
        )}

        {loading && !data ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${GRID_COLS[settings.columns] ?? 'lg:grid-cols-3'} gap-5`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-primary-500/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className={
              masonry
                ? `columns-1 sm:columns-2 ${MASONRY_COLS[settings.columns] ?? 'lg:columns-3'} gap-5 [&>*]:mb-5`
                : `grid grid-cols-1 sm:grid-cols-2 ${GRID_COLS[settings.columns] ?? 'lg:grid-cols-3'} gap-5`
            }
          >
            <AnimatePresence mode="popLayout">
              {images.map((image, index) => (
                <motion.button
                  type="button"
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.7, ...FLY_FROM[index % FLY_FROM.length] }}
                  whileInView={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.9, delay: (index % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative block w-full break-inside-avoid text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-2xl"
                  onClick={() => setSelected(index)}
                  aria-label={`View photo: ${image.caption || image.alt || 'gallery photo'}`}
                >
                  <FramedPhoto
                    src={image.image_url}
                    alt={image.alt || image.caption}
                    aspect={settings.aspect_ratio}
                    crop={image.crop_mode ?? settings.crop_mode}
                    gravity={image.gravity}
                    frame={image.frame_style ?? settings.frame_style}
                    natural={masonry}
                    caption={image.caption}
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {(image.frame_style ?? settings.frame_style) !== 'polaroid' && image.caption && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="text-white font-medium">{image.caption}</p>
                        {image.category_name && (
                          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary-500/30 text-primary-100 text-xs capitalize">
                            {image.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <button
              className="absolute top-4 right-4 p-3 rounded-full bg-primary-500/20 text-white hover:bg-primary-500/40 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setSelected(null)}
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-primary-500/20 text-white hover:bg-primary-500/40 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-primary-500/20 text-white hover:bg-primary-500/40 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <motion.figure
              key={current.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* The lightbox always shows the whole, uncropped photo. */}
              <img
                src={fitUrl(current.image_url)}
                alt={current.alt || current.caption}
                className="mx-auto max-h-[80vh] w-auto object-contain rounded-2xl"
              />
              {current.caption && (
                <figcaption className="mt-4 text-center text-white text-lg font-medium">{current.caption}</figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
