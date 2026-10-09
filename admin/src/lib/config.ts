/**
 * Backend base URL (no trailing slash). NEXT_PUBLIC_BACKEND_URL wins; otherwise production
 * builds talk to the live API and dev builds to the local backend.
 * Keep the default in sync with next.config.mjs (Content-Security-Policy connect-src).
 */
export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.wsfxacademy.com' : 'http://localhost:4000')
).replace(/\/$/, '');

export const SITE_URL = 'https://wsfxacademy.com';
