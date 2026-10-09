import { motion } from 'framer-motion';

type Item =
  | { kind: 'symbol'; text: string; left: string; top: string; size: number; duration: number; delay: number; gold?: boolean }
  | { kind: 'candle'; up: boolean; left: string; top: string; size: number; duration: number; delay: number };

// Fixed positions (no randomness) so server/client and re-renders always match.
const ITEMS: Item[] = [
  { kind: 'symbol', text: '$', left: '6%', top: '22%', size: 34, duration: 9, delay: 0 },
  { kind: 'symbol', text: '€', left: '44%', top: '12%', size: 26, duration: 11, delay: 1.2 },
  { kind: 'symbol', text: '£', left: '88%', top: '18%', size: 30, duration: 10, delay: 0.6 },
  { kind: 'symbol', text: '¥', left: '12%', top: '70%', size: 28, duration: 12, delay: 2 },
  { kind: 'symbol', text: '₦', left: '52%', top: '78%', size: 36, duration: 10, delay: 0.4, gold: true },
  { kind: 'symbol', text: '₿', left: '92%', top: '62%', size: 24, duration: 13, delay: 1.8, gold: true },
  { kind: 'symbol', text: '%', left: '30%', top: '40%', size: 20, duration: 8, delay: 2.6 },
  { kind: 'candle', up: true, left: '3%', top: '45%', size: 70, duration: 7, delay: 0.3 },
  { kind: 'candle', up: false, left: '95%', top: '35%', size: 60, duration: 8, delay: 1 },
  { kind: 'candle', up: true, left: '62%', top: '6%', size: 46, duration: 9, delay: 2.2 },
  { kind: 'candle', up: false, left: '36%', top: '88%', size: 52, duration: 7.5, delay: 1.5 },
  { kind: 'candle', up: true, left: '78%', top: '84%', size: 40, duration: 8.5, delay: 0.8 },
];

const Candle = ({ up, size }: { up: boolean; size: number }) => {
  const c = up ? '#22c55e' : '#ef4444';
  return (
    <svg width={size * 0.4} height={size} viewBox="0 0 24 60" aria-hidden>
      <line x1="12" y1="0" x2="12" y2="60" stroke={c} strokeWidth="2" />
      <rect x="5" y={up ? 14 : 18} width="14" height={up ? 30 : 26} rx="2" fill={c} />
    </svg>
  );
};

/** Currency symbols and candlesticks drifting around the hero. Decorative only. */
const FloatingSymbols = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {ITEMS.map((it, i) => (
      <motion.div
        key={i}
        className={`absolute ${i % 3 === 2 ? 'hidden md:block' : ''}`}
        style={{ left: it.left, top: it.top }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{
          opacity: [0, 0.35, 0.25, 0.35],
          scale: 1,
          y: [0, -28, 0, 18, 0],
          x: [0, 10, -8, 0],
          rotate: it.kind === 'symbol' ? [0, 12, -8, 0] : [0, 4, -4, 0],
        }}
        transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        {it.kind === 'symbol' ? (
          <span
            className={`font-display font-bold ${it.gold ? 'text-accent-500' : 'text-primary-400'}`}
            style={{ fontSize: it.size, textShadow: '0 0 24px currentColor' }}
          >
            {it.text}
          </span>
        ) : (
          <Candle up={it.up} size={it.size} />
        )}
      </motion.div>
    ))}
  </div>
);

export default FloatingSymbols;
