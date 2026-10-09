import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { framedUrl } from '../lib/frame';
import type { ArticleSummary } from '../types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

function ArticleCard({ a, index = 0 }: { a: ArticleSummary; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group overflow-hidden rounded-2xl border border-primary-500/15 bg-primary-500/5 transition hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/10"
    >
      <Link to={`/blog/${a.slug}`} className="block">
        <div className="aspect-[16/9] overflow-hidden bg-primary-500/10">
          {a.cover_image_url ? (
            <img
              src={framedUrl(a.cover_image_url, { aspect: '16:9', crop: 'fill', width: 700 })}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary-500/50">
              <BookOpen className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="flex items-center gap-2 text-xs text-adaptive-muted">
            {formatDate(a.published_at)} <span aria-hidden>·</span>
            <Clock className="h-3.5 w-3.5" /> {a.reading_minutes} min read
          </p>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug text-adaptive group-hover:text-primary-500">
            {a.title}
          </h3>
          {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-adaptive-secondary">{a.excerpt}</p>}
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-500">
            Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default ArticleCard;
