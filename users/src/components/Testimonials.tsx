import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, PenLine } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import CountUp from './fx/CountUp';
import type { GoogleReview, TestimonialsData } from '../types';

/** Google "G" mark, used for the required attribution. */
const GoogleG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const Stars = ({ value, size = 'h-5 w-5' }: { value: number; size?: string }) => (
  <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-accent-500 text-accent-500' : 'text-adaptive-muted opacity-40'}`} />
    ))}
  </span>
);

function ReviewCard({ review, index }: { review: GoogleReview; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.text.length > 260;

  return (
    <motion.article
      initial={{ opacity: 0, y: 80, rotateX: -40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1000 }}
      className="relative flex h-full flex-col rounded-3xl border border-adaptive bg-adaptive-card p-7 transition-all duration-500 card-hover"
    >
      <div className="mb-4 flex items-center gap-3">
        {review.author_photo_uri ? (
          <img
            src={review.author_photo_uri}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-11 w-11 rounded-full ring-2 ring-primary-500/30"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-bold text-white">
            {review.author_name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {review.author_uri ? (
            <a href={review.author_uri} target="_blank" rel="noopener noreferrer" className="block truncate font-bold text-adaptive hover:text-primary-500">
              {review.author_name}
            </a>
          ) : (
            <p className="truncate font-bold text-adaptive">{review.author_name}</p>
          )}
          <p className="text-xs text-adaptive-muted">{review.relative_time}</p>
        </div>
        <GoogleG />
      </div>
      <Stars value={review.rating} size="h-4 w-4" />
      <p className={`mt-3 flex-1 leading-relaxed text-adaptive-secondary ${expanded ? '' : 'line-clamp-6'}`}>{review.text}</p>
      {long && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-2 self-start text-sm font-semibold text-primary-500 hover:text-primary-400">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </motion.article>
  );
}

/** Testimonials = the academy's Google reviews (synced by the backend). Hidden until set up. */
const Testimonials = () => {
  const { data } = useApi<TestimonialsData>('/testimonials');
  if (!data?.summary || data.reviews.length === 0) return null;
  const { summary, reviews } = data;

  return (
    <section id="testimonials" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent" />
      <div className="absolute left-0 right-0 top-0 section-divider" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-500">
            <Star className="h-4 w-4" />
            Reviews
          </span>
          <h2 className="mb-6 font-display text-4xl font-bold text-adaptive sm:text-5xl">
            What Our <span className="gradient-text">Students Say</span>
          </h2>

          {summary.rating !== null && (
            <div className="mx-auto inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-adaptive bg-adaptive-card px-6 py-4">
              <GoogleG className="h-7 w-7" />
              <span className="font-display text-4xl font-bold text-adaptive"><CountUp value={summary.rating.toFixed(1)} /></span>
              <div className="text-left">
                <Stars value={summary.rating} />
                <p className="text-sm text-adaptive-muted">
                  Based on {summary.total_reviews?.toLocaleString() ?? 0} Google reviews
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {summary.maps_uri && (
            <a href={summary.maps_uri} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> See all reviews on Google
            </a>
          )}
          <a href={summary.write_review_uri} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
            <PenLine className="h-4 w-4" /> Write a review
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
