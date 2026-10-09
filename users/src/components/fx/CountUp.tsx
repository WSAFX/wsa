import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Splits "₦2,500B+" into prefix "₦", number 2500, suffix "B+" (null if there is no number). */
function parse(value: string) {
  const m = value.match(/^([^\d]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  return {
    prefix: m[1],
    number: parseFloat(raw.replace(/,/g, '')),
    suffix: m[3],
    decimals: raw.includes('.') ? raw.split('.')[1].length : 0,
    grouped: raw.includes(','),
  };
}

/**
 * Counts up to a display value such as "5,000+", "₦150,000", "95%" or "₦2B+" when it scrolls
 * into view. Non-numeric values render as-is; reduced-motion users get the final value.
 */
const CountUp = ({ value, duration = 2, className = '' }: { value: string; duration?: number; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const parts = parse(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || !parts || !inView || reduced) return;
    const format = (n: number) =>
      parts.prefix +
      (parts.grouped
        ? n.toLocaleString('en-US', { minimumFractionDigits: parts.decimals, maximumFractionDigits: parts.decimals })
        : n.toFixed(parts.decimals)) +
      parts.suffix;
    const controls = animate(0, parts.number, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = format(v)),
      onComplete: () => (node.textContent = value),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, value, duration]);

  const initial = parts && !reduced ? `${parts.prefix}0${parts.suffix}` : value;
  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={value}>
      {initial}
    </span>
  );
};

export default CountUp;
