import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import BatchShowcase from './BatchShowcase';
import type { Batch } from '../types';

/** Home-page section for the batch(es) the admin marked "Show on home page". */
const OutgoingBatch = () => {
  const { data: batches } = useApi<Batch[]>('/batches/home');
  const visible = (batches ?? []).filter((b) => b.featured_image_url || b.images?.length);
  if (!visible.length) return null;
  // Mounted only once there is data, so useInView's ref is attached on its first render.
  return <OutgoingBatchSection batches={visible} />;
};

const OutgoingBatchSection = ({ batches: visible }: { batches: Batch[] }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const allOutgoing = visible.every((b) => b.status === 'outgoing');

  return (
    <section id="batches" className="relative py-24 overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 right-0 section-divider" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/30 text-accent-600 dark:text-accent-400 text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" />
            {allOutgoing ? 'Outgoing Batch' : 'Our Batches'}
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-adaptive mb-4">
            Celebrating Our <span className="gradient-text">Graduates</span>
          </h2>
          <p className="text-xl text-adaptive-secondary max-w-3xl mx-auto">
            Every batch is a new set of disciplined traders. Meet the class that just completed the journey.
          </p>
        </motion.div>

        <div className="space-y-20">
          {visible.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.1 }}
            >
              <BatchShowcase batch={batch} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/batches"
            className="inline-flex items-center gap-2 font-semibold text-primary-500 hover:text-primary-400"
          >
            See all our batches <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OutgoingBatch;
