import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const NotFoundPage = ({ message = "The page you're looking for doesn't exist." }: { message?: string }) => {
  usePageMeta('Page not found');
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="font-display text-7xl font-bold gradient-text">404</p>
      <p className="mt-4 text-lg text-adaptive-secondary">{message}</p>
      <Link to="/" className="btn-primary mt-8 inline-flex">
        Back to home
      </Link>
    </main>
  );
};

export default NotFoundPage;
