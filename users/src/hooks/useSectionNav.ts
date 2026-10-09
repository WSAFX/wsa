import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const HEADER_HEIGHT = 80;

export function scrollToId(hash: string, behavior: ScrollBehavior = 'smooth') {
  const el = document.querySelector(hash);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
  window.scrollTo({ top, behavior });
  return true;
}

/**
 * Navigate to a home-page section ("#courses"), a page ("/blog") or "/#about".
 * Section links smooth-scroll when already on the home page; from other pages
 * they route home and Home scrolls to the hash once it has rendered.
 */
export function useSectionNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (href: string) => {
      const hash = href.startsWith('#') ? href : href.startsWith('/#') ? href.slice(1) : null;
      if (hash) {
        if (pathname === '/') {
          scrollToId(hash);
          window.history.replaceState(null, '', hash);
        } else {
          navigate(`/${hash}`);
        }
        return;
      }
      navigate(href);
      window.scrollTo({ top: 0 });
    },
    [navigate, pathname],
  );
}
