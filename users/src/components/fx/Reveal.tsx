import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'flip' | 'fly-left' | 'fly-right';

const OFFSETS: Record<RevealFrom, Record<string, number>> = {
  up: { y: 50 },
  down: { y: -50 },
  left: { x: -80 },
  right: { x: 80 },
  zoom: { scale: 0.8 },
  flip: { rotateX: -70, y: 40 },
  'fly-left': { x: -160, y: 60, rotate: -10, scale: 0.85 },
  'fly-right': { x: 160, y: 60, rotate: 10, scale: 0.85 },
};

const revealVariants = (from: RevealFrom): Variants => ({
  hidden: { opacity: 0, ...OFFSETS[from] },
  show: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0 },
});

/** Slides/flies its children in once they scroll into view. */
const Reveal = ({
  children,
  from = 'up',
  delay = 0,
  duration = 0.8,
  className = '',
  amount = 0.25,
}: {
  children: ReactNode;
  from?: RevealFrom;
  delay?: number;
  duration?: number;
  className?: string;
  amount?: number;
}) => (
  <motion.div
    className={className}
    variants={revealVariants(from)}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount }}
    transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    style={from === 'flip' ? { transformPerspective: 900 } : undefined}
  >
    {children}
  </motion.div>
);

export default Reveal;
