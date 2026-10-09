import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero, About, Gallery, Courses, Testimonials, Contact } from '../components';
import OutgoingBatch from '../components/OutgoingBatch';
import TraderTools from '../components/TraderTools';
import { scrollToId } from '../hooks/useSectionNav';
import { usePageMeta } from '../hooks/usePageMeta';

const HomePage = () => {
  const { hash } = useLocation();
  usePageMeta(null);

  // Arriving from another page via "/#section": wait for sections (some load data) then scroll.
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    const t = setInterval(() => {
      if (scrollToId(hash) || ++tries > 20) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [hash]);

  return (
    <main>
      <Hero />
      <About />
      <Courses />
      <TraderTools />
      <OutgoingBatch />
      <Gallery />
      <Testimonials />
      <Contact />
    </main>
  );
};

export default HomePage;
