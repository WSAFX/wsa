import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fitUrl } from '../lib/frame';

interface Props {
  photos: { image_url: string; caption?: string }[];
  index: number | null;
  onChange: (index: number | null) => void;
}

/** Full-screen, uncropped photo viewer with keyboard + arrow navigation. */
const Lightbox = ({ photos, index, onChange }: Props) => {
  const current = index !== null ? photos[index] : null;
  const step = (dir: -1 | 1) => index !== null && onChange((index + dir + photos.length) % photos.length);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') onChange((index + 1) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onChange]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
          onClick={() => onChange(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-primary-500/20 p-3 text-white transition-colors hover:bg-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => onChange(null)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary-500/20 p-3 text-white transition-colors hover:bg-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary-500/20 p-3 text-white transition-colors hover:bg-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <motion.figure
            key={current.image_url}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={fitUrl(current.image_url)} alt={current.caption ?? ''} className="mx-auto max-h-[80vh] w-auto rounded-2xl object-contain" />
            <figcaption className="mt-4 text-center text-white/90">
              {current.caption}
              {photos.length > 1 && (
                <span className="ml-3 text-sm text-white/50">
                  {index! + 1} / {photos.length}
                </span>
              )}
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
