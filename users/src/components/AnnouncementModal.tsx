import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useSectionNav } from '../hooks/useSectionNav';
import { fitUrl } from '../lib/frame';
import type { Announcement } from '../types';

/**
 * Shows the live announcement on every full page load until the admin turns it off.
 * Closing it hides it for the rest of this visit only (state lives in memory, so a
 * reload shows it again — by design). Mirrors admin/src/components/AnnouncementPreview.tsx.
 */
const AnnouncementModal = () => {
  const { data: a } = useApi<Announcement | null>('/announcement');
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const goTo = useSectionNav();

  // Small delay so the modal doesn't fight the hero's entrance animation.
  useEffect(() => {
    if (!a) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [a]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!a) return null;

  const layout = a.image_url ? a.layout : 'image_top';
  const onImage = layout === 'image_background';
  const image = a.image_url ? fitUrl(a.image_url, 1200) : null;
  const external = /^https?:\/\//.test(a.cta_href);

  const handleCta = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (external || !a.cta_href) return;
    e.preventDefault();
    setOpen(false);
    goTo(a.cta_href);
  };

  const body = (
    <>
      <h2
        id="announcement-title"
        className={`font-display text-2xl sm:text-3xl font-bold leading-tight ${onImage ? 'text-white' : 'text-adaptive'}`}
      >
        {a.title}
      </h2>
      {a.body_html && (
        <div
          className={`rich-text mt-3 text-sm sm:text-base leading-relaxed ${onImage ? 'text-white/90' : 'text-adaptive-secondary'}`}
          dangerouslySetInnerHTML={{ __html: a.body_html }}
        />
      )}
      {a.cta_label && a.cta_href && (
        <a
          href={a.cta_href}
          onClick={handleCta}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="btn-primary mt-6 inline-flex"
        >
          {a.cta_label}
        </a>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-h-[90vh] overflow-hidden rounded-3xl bg-adaptive shadow-2xl ring-1 ring-primary-500/20 ${
              layout === 'image_left' ? 'max-w-3xl' : 'max-w-lg'
            }`}
          >
            <button
              ref={closeRef}
              onClick={() => setOpen(false)}
              aria-label="Close announcement"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X className="h-5 w-5" />
            </button>

            {layout === 'image_background' ? (
              <div className="relative">
                <img src={image!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/95 via-dark-950/70 to-dark-950/30" />
                <div className="relative flex min-h-[420px] max-h-[90vh] flex-col justify-end overflow-y-auto p-6 sm:p-10">
                  {body}
                </div>
              </div>
            ) : layout === 'image_left' ? (
              <div className="grid max-h-[90vh] sm:grid-cols-2">
                <img src={image!} alt="" className="h-56 w-full object-cover sm:h-full" />
                <div className="overflow-y-auto p-6 sm:p-8">{body}</div>
              </div>
            ) : (
              <div className="max-h-[90vh] overflow-y-auto">
                {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
                <div className="p-6 sm:p-8">{body}</div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementModal;
