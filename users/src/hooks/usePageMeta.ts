import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Wallstreet Forex Academy';
const ORIGIN = 'https://wsfxacademy.com';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Sets title, description, canonical URL and share tags for client-rendered pages. */
export function usePageMeta(title?: string | null, description?: string | null) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} | Master Forex Trading`;
    document.title = fullTitle;
    setMeta('property', 'og:title', fullTitle);

    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
    }

    // Canonical always points at the primary domain (no www, no query string).
    const url = `${ORIGIN}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
    setMeta('property', 'og:url', url);
  }, [title, description, pathname]);
}
