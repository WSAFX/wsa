import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import { framedUrl } from '../lib/frame';
import ArticleCard from '../components/ArticleCard';
import NotFoundPage from './NotFoundPage';
import type { Article, ArticleSummary } from '../types';

const BlogPostPage = () => {
  const { slug = '' } = useParams();
  const { data: a, loading, error } = useApi<Article>(`/articles/${encodeURIComponent(slug)}`);
  const { data: related } = useApi<ArticleSummary[]>(a ? `/articles/${encodeURIComponent(slug)}/related` : null);
  usePageMeta(a ? a.meta_title || a.title : null, a ? a.meta_description || a.excerpt : null);

  if (error) return <NotFoundPage message="That article doesn't exist or is no longer published." />;

  return (
    <main className="pb-24 pt-28">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-400">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        {loading || !a ? (
          <div className="space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-primary-500/10" />
            <div className="aspect-[16/9] animate-pulse rounded-2xl bg-primary-500/10" />
            <div className="h-40 animate-pulse rounded-xl bg-primary-500/10" />
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold leading-tight text-adaptive sm:text-5xl">{a.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-adaptive-muted">
              <span>{a.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={a.published_at}>
                {new Date(a.published_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
              <span aria-hidden>·</span>
              <Clock className="h-4 w-4" /> {a.reading_minutes} min read
            </p>
            {a.cover_image_url && (
              <img
                src={framedUrl(a.cover_image_url, { aspect: '16:9', crop: 'fill', width: 1400 })}
                alt=""
                className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
              />
            )}
            {/* content_html is sanitized server-side (backend/src/lib/sanitize.ts) */}
            <div className="rich-text article-body mt-10 text-lg leading-relaxed text-adaptive-secondary" dangerouslySetInnerHTML={{ __html: a.content_html }} />
            <p className="mt-12 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 text-sm text-adaptive-muted">
              This article is for education only and is not financial advice. Trading forex carries risk.
            </p>
          </>
        )}
      </article>

      {related && related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-2xl font-bold text-adaptive">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <ArticleCard key={r.id} a={{ ...r, author: '', featured: false }} index={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default BlogPostPage;
