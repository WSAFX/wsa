import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import ArticleCard from '../components/ArticleCard';
import type { ArticleSummary, Paginated } from '../types';

const BlogListPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const category = params.get('category') ?? '';
  const qs = new URLSearchParams({ page: String(page), limit: '9', ...(category ? { category } : {}) });

  const { data, loading, error } = useApi<Paginated<ArticleSummary>>(`/articles?${qs}`);
  const { data: categories } = useApi<{ id: string; name: string; slug: string }[]>('/categories');
  usePageMeta('Blog', 'Forex trading lessons, market insights and academy news from Wallstreet Forex Academy.');

  const setQuery = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-500">
          <BookOpen className="h-4 w-4" /> The WSA Blog
        </span>
        <h1 className="font-display text-4xl font-bold text-adaptive sm:text-5xl">
          Learn. Trade. <span className="gradient-text">Grow.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-adaptive-secondary">
          Practical forex lessons, market insights and news from the academy.
        </p>
      </header>

      {categories && categories.length > 0 && (
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {[{ slug: '', name: 'All' }, ...categories].map((c) => (
            <button
              key={c.slug || 'all'}
              onClick={() => setQuery({ category: c.slug, page: '' })}
              aria-pressed={category === c.slug}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                category === c.slug
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'border border-primary-500/20 bg-primary-500/10 text-adaptive-secondary hover:text-adaptive'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-primary-500/10" />
          ))}
        </div>
      )}
      {error && <p className="text-center text-adaptive-secondary">Couldn't load articles right now. Please try again later.</p>}
      {data && data.items.length === 0 && (
        <p className="py-16 text-center text-adaptive-secondary">No articles here yet. Check back soon!</p>
      )}
      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a, i) => (
              <ArticleCard key={a.id} a={a} index={i} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: data.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuery({ page: i === 0 ? '' : String(i + 1) })}
                  aria-current={page === i + 1 ? 'page' : undefined}
                  className={`h-10 w-10 rounded-xl text-sm font-semibold ${
                    page === i + 1 ? 'bg-primary-500 text-white' : 'border border-primary-500/20 text-adaptive-secondary hover:text-adaptive'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </main>
  );
};

export default BlogListPage;
