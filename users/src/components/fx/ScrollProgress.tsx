import { motion, useScroll, useSpring } from 'framer-motion';

/** Thin blue→gold bar across the top of the page showing scroll progress. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500"
    />
  );
};

export default ScrollProgress;
