import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Check } from 'lucide-react';
import PipCalculator from './PipCalculator';
import { INSTRUMENTS } from '../lib/instruments';

const POINTS = [
  `${INSTRUMENTS.length} instruments: top 50 pairs, USD/NGN, gold & silver`,
  'Pip value in naira, dollars and 8 more currencies',
  'Risk-based position sizing with take-profit R:R',
  'Live exchange rates, broker settings you can adjust',
];

/** Home-page feature section for the pip calculator. */
const TraderTools = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="tools" className="relative overflow-hidden py-24" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 to-transparent" />
      <div className="absolute left-0 right-0 top-0 section-divider" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-400">
            <Calculator className="h-4 w-4" /> Free Trader Tool
          </span>
          <h2 className="mb-6 font-display text-4xl font-bold text-adaptive sm:text-5xl">
            Know Your Risk <span className="gradient-text">Before You Trade</span>
          </h2>
          <p className="mb-8 text-xl text-adaptive-secondary">
            Our pip calculator tells you what every pip is worth and exactly how many lots to trade, so a stop loss never
            costs more than you planned.
          </p>
          <ul className="mb-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-adaptive-secondary">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/20">
                  <Check className="h-3 w-3 text-primary-500" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link to="/pip-calculator" className="btn-primary inline-flex items-center gap-2">
            Open the full calculator <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.15 }}>
          <PipCalculator compact />
        </motion.div>
      </div>
    </section>
  );
};

export default TraderTools;
