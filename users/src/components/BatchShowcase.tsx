import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { fitUrl, framedSrcSet, framedUrl } from '../lib/frame';
import Lightbox from './Lightbox';
import type { Batch, BatchPhoto } from '../types';

const formatDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : null;

/** Auto-advancing index that pauses while the user hovers or after they interact. */
function useAutoplay(length: number, ms = 4000) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % length), ms);
    return () => clearInterval(t);
  }, [paused, length, ms]);

  const go = useCallback((i: number) => setIndex(((i % length) + length) % length), [length]);
  // Clamp rather than reset in an effect, in case the photo count shrinks.
  return { index: length ? index % length : 0, go, setPaused };
}

function Banner({ batch, image, onOpen }: { batch: Batch; image: string; onOpen?: () => void }) {
  const grad = formatDate(batch.graduation_date);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-3xl text-left shadow-2xl shadow-primary-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      aria-label={`View featured photo of ${batch.name}`}
    >
      <img
        src={framedUrl(image, { aspect: '16:9', crop: 'fill', width: 1400 })}
        srcSet={framedSrcSet(image, { aspect: '16:9', crop: 'fill' })}
        sizes="(min-width: 1280px) 1200px, 100vw"
        alt={`${batch.name} group photo`}
        className="aspect-[16/9] w-full object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
        <h3 className="font-display text-2xl font-bold text-white sm:text-4xl">{batch.name}</h3>
        {grad && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/80">
            <CalendarDays className="h-4 w-4" /> Graduated {grad}
          </p>
        )}
      </div>
    </button>
  );
}

/** Featured image + an auto-sliding strip (1 photo on phones, 3 on desktop). */
function SliderView({ batch, featured, photos, open }: ViewProps) {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setPerView(mq.matches ? 3 : 1);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const pages = Math.max(1, photos.length - perView + 1);
  const { index, go, setPaused } = useAutoplay(pages, 3500);

  return (
    <div className="space-y-5">
      <Banner batch={batch} image={featured} onOpen={() => open(-1)} />
      {photos.length > 0 && (
        <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="overflow-hidden rounded-2xl">
            <motion.div
              className="flex"
              animate={{ x: `-${(index * 100) / perView}%` }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) go(index + 1);
                if (info.offset.x > 50) go(index - 1);
              }}
            >
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => open(i)}
                  className="shrink-0 px-1.5 focus:outline-none"
                  style={{ width: `${100 / perView}%` }}
                  aria-label={`View photo ${i + 1}${p.caption ? `: ${p.caption}` : ''}`}
                >
                  <img
                    src={framedUrl(p.image_url, { aspect: '4:3', crop: 'fill', width: 700 })}
                    alt={p.caption || `${batch.name} photo ${i + 1}`}
                    loading="lazy"
                    draggable={false}
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                </button>
              ))}
            </motion.div>
          </div>
          {pages > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full glass-dark p-2.5 text-adaptive shadow-lg hover:text-primary-500"
                aria-label="Previous photos"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full glass-dark p-2.5 text-adaptive shadow-lg hover:text-primary-500"
                aria-label="Next photos"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="mt-4 flex justify-center gap-1.5">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-primary-500' : 'w-2 bg-primary-500/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** One large photo that cycles, with a clickable thumbnail strip. */
function FeaturedThumbsView({ batch, featured, photos, open }: ViewProps) {
  const all = [{ id: 'featured', image_url: featured, caption: batch.name } as BatchPhoto, ...photos.filter((p) => p.image_url !== featured)];
  const { index, go, setPaused } = useAutoplay(all.length, 4500);
  const current = all[index];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-primary-950/30">
        <AnimatePresence mode="wait">
          <motion.button
            key={current.image_url}
            type="button"
            onClick={() => open(index === 0 ? -1 : photos.indexOf(current))}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="block w-full"
            aria-label="Open photo"
          >
            <img
              src={framedUrl(current.image_url, { aspect: '16:9', crop: 'fill', width: 1400 })}
              srcSet={framedSrcSet(current.image_url, { aspect: '16:9', crop: 'fill' })}
              sizes="(min-width: 1280px) 1200px, 100vw"
              alt={current.caption || batch.name}
              className="aspect-[16/9] w-full object-cover"
            />
          </motion.button>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-950/90 to-transparent p-5 sm:p-8">
          <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">{batch.name}</h3>
          {current.caption && current.caption !== batch.name && <p className="mt-1 text-white/80">{current.caption}</p>}
        </div>
      </div>
      {all.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {all.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === index ? 'ring-primary-500' : 'opacity-60 ring-transparent hover:opacity-100'
              }`}
            >
              <img
                src={framedUrl(p.image_url, { aspect: '1:1', crop: 'fill', width: 160 })}
                alt=""
                loading="lazy"
                className="h-16 w-16 object-cover sm:h-20 sm:w-20"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GridView({ batch, featured, photos, open }: ViewProps) {
  return (
    <div className="space-y-5">
      <Banner batch={batch} image={featured} onOpen={() => open(-1)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => open(i)} className="group overflow-hidden rounded-2xl" aria-label={`View photo ${i + 1}`}>
            <img
              src={framedUrl(p.image_url, { aspect: '1:1', crop: 'fill', width: 500 })}
              alt={p.caption || `${batch.name} photo ${i + 1}`}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function MasonryView({ batch, featured, photos, open }: ViewProps) {
  return (
    <div className="space-y-5">
      <Banner batch={batch} image={featured} onOpen={() => open(-1)} />
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => open(i)}
            className="group block w-full break-inside-avoid overflow-hidden rounded-2xl"
            aria-label={`View photo ${i + 1}`}
          >
            <img
              src={fitUrl(p.image_url, 600)}
              alt={p.caption || `${batch.name} photo ${i + 1}`}
              loading="lazy"
              className="w-full transition-transform duration-700 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface ViewProps {
  batch: Batch;
  featured: string;
  photos: BatchPhoto[];
  /** -1 opens the featured image */
  open: (photoIndex: number) => void;
}

/** Renders a batch using the display mode the admin chose. */
const BatchShowcase = ({ batch }: { batch: Batch }) => {
  const photos = batch.images ?? [];
  const featured = batch.featured_image_url ?? photos[0]?.image_url;
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!featured) return null;

  // Lightbox list: featured first (unless it is also one of the photos), then the photos.
  const featuredIsPhoto = photos.some((p) => p.image_url === featured);
  const viewer = featuredIsPhoto ? photos : [{ image_url: featured, caption: batch.name }, ...photos];
  const open = (photoIndex: number) => {
    if (photoIndex === -1) setLightbox(featuredIsPhoto ? photos.findIndex((p) => p.image_url === featured) : 0);
    else setLightbox(featuredIsPhoto ? photoIndex : photoIndex + 1);
  };

  const props: ViewProps = { batch, featured, photos, open };

  return (
    <>
      {batch.display_mode === 'featured_thumbs' ? (
        <FeaturedThumbsView {...props} />
      ) : batch.display_mode === 'grid' ? (
        <GridView {...props} />
      ) : batch.display_mode === 'masonry' ? (
        <MasonryView {...props} />
      ) : (
        <SliderView {...props} />
      )}
      {batch.description && (
        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-adaptive-secondary">{batch.description}</p>
      )}
      <Lightbox photos={viewer} index={lightbox} onChange={setLightbox} />
    </>
  );
};

export default BatchShowcase;
