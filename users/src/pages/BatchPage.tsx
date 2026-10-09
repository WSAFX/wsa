import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import BatchShowcase from '../components/BatchShowcase';
import NotFoundPage from './NotFoundPage';
import type { Batch } from '../types';

const BatchPage = () => {
  const { slug = '' } = useParams();
  const { data: batch, loading, error } = useApi<Batch>(`/batches/${encodeURIComponent(slug)}`);
  usePageMeta(batch?.name, batch?.description || null);

  if (error) return <NotFoundPage message="We couldn't find that batch." />;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <Link to="/batches" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-400">
        <ArrowLeft className="h-4 w-4" /> All batches
      </Link>
      {loading || !batch ? (
        <div className="aspect-[16/9] animate-pulse rounded-3xl bg-primary-500/10" />
      ) : (
        <BatchShowcase batch={batch} />
      )}
    </main>
  );
};

export default BatchPage;
