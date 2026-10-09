import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Images } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import { framedUrl } from '../lib/frame';
import type { Batch } from '../types';

const STATUS: Record<Batch['status'], string> = {
  current: 'In class now',
  outgoing: 'Just graduated',
  archived: 'Alumni',
};

const BatchesPage = () => {
  const { data, loading, error } = useApi<Batch[]>('/batches');
  usePageMeta('Our Batches', 'Every class that has trained at Wallstreet Forex Academy in Enugu.');

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-400">
          <GraduationCap className="h-4 w-4" /> Our Batches
        </span>
        <h1 className="font-display text-4xl font-bold text-adaptive sm:text-5xl">
          Class by <span className="gradient-text">Class</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-adaptive-secondary">
          Every batch that has walked through our doors, and the traders they became.
        </p>
      </header>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-primary-500/10" />
          ))}
        </div>
      )}
      {error && <p className="text-center text-adaptive-secondary">Couldn't load batches right now.</p>}
      {data && data.length === 0 && <p className="py-16 text-center text-adaptive-secondary">No batches to show yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data
          ?.filter((b) => b.featured_image_url)
          .map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                to={`/batches/${b.slug}`}
                className="group relative block overflow-hidden rounded-2xl shadow-xl shadow-primary-950/20"
              >
                <img
                  src={framedUrl(b.featured_image_url!, { aspect: '4:3', crop: 'fill', width: 700 })}
                  alt={`${b.name} group photo`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="rounded-full bg-accent-500/90 px-2.5 py-0.5 text-xs font-semibold text-dark-950">{STATUS[b.status]}</span>
                  <h2 className="mt-2 font-display text-xl font-bold text-white">{b.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                    <Images className="h-4 w-4" /> {b.image_count ?? 0} photos
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
      </div>
    </main>
  );
};

export default BatchesPage;
