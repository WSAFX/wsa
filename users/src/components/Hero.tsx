import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import ParticleField from './fx/ParticleField';
import FloatingSymbols from './fx/FloatingSymbols';
import CountUp from './fx/CountUp';
import TiltCard from './fx/TiltCard';
import { TrendingUp, ArrowRight, Play, BarChart3, Shield, Award } from 'lucide-react';
import { STATS, CURRENCY_PAIRS } from '../data/constants';
import { useSiteData } from '../context/SiteDataContext';
import { useSectionNav } from '../hooks/useSectionNav';
import type { HeroContent } from '../types';

const DEFAULT_HERO: HeroContent = {
  badge_text: "Nigeria's Premier Forex Academy",
  heading: 'Master the Art of Forex Trading',
  heading_highlight: 'Art of Forex',
  subheading:
    'Join thousands of successful traders trained at Wallstreet Forex Academy. Learn from experts with over 15 years of market experience.',
  cta_label: 'Start Learning',
  cta_href: '#courses',
  secondary_cta_label: 'Learn More',
  secondary_cta_href: '#about',
};

/** The heading, revealed word by word, with the admin-chosen phrase in the brand gradient. */
const HighlightedHeading = ({ heading, highlight }: { heading: string; highlight: string }) => {
  const idx = highlight ? heading.indexOf(highlight) : -1;
  const segments =
    idx < 0
      ? [{ text: heading, hl: false }]
      : [
          { text: heading.slice(0, idx), hl: false },
          { text: highlight, hl: true },
          { text: heading.slice(idx + highlight.length), hl: false },
        ];
  const words = segments.flatMap((seg) =>
    seg.text
      .split(' ')
      .filter(Boolean)
      .map((w) => ({ w, hl: seg.hl })),
  );
  return (
    <>
      {words.map(({ w, hl }, i) => (
        <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
          <motion.span
            className={`inline-block ${hl ? 'gradient-text' : 'text-adaptive'}`}
            initial={{ y: '110%', rotate: 6, opacity: 0 }}
            animate={{ y: '0%', rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </>
  );
};

/** Big blurred colour orbs that slowly drift behind the hero. */
const Orb = ({ className, duration, path }: { className: string; duration: number; path: { x: number[]; y: number[] } }) => (
  <motion.div
    aria-hidden
    className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    animate={{ x: path.x, y: path.y, scale: [1, 1.15, 0.95, 1] }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
  />
);

const Hero = () => {
  const { hero: liveHero, about } = useSiteData();
  const hero = liveHero ?? DEFAULT_HERO;
  const stats = about?.stats?.length ? about.stats : STATS;
  const goTo = useSectionNav();

  const mx = useSpring(useMotionValue(-500), { stiffness: 120, damping: 25 });
  const my = useSpring(useMotionValue(-500), { stiffness: 120, damping: 25 });
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(59,130,246,0.14), transparent 70%)`;
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <section id="home" onPointerMove={onPointerMove} className="relative min-h-screen overflow-hidden hero-gradient">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <ParticleField className="opacity-80" />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
      <FloatingSymbols />
      
      
      <Orb className="top-1/4 left-1/4 w-96 h-96 bg-primary-500/15" duration={18} path={{ x: [0, 80, -40, 0], y: [0, -50, 40, 0] }} />
      <Orb className="bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10" duration={22} path={{ x: [0, -90, 30, 0], y: [0, 40, -60, 0] }} />
      <Orb className="top-10 right-1/3 w-72 h-72 bg-primary-400/10" duration={26} path={{ x: [0, 60, -70, 0], y: [0, 70, 20, 0] }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            {hero.badge_text && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-6"
              >
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                <span className="text-primary-500 dark:text-primary-400 text-sm font-medium">{hero.badge_text}</span>
              </motion.div>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              <HighlightedHeading heading={hero.heading} highlight={hero.heading_highlight} />
            </h1>

            <p className="text-xl text-adaptive-secondary mb-8 max-w-xl leading-relaxed">{hero.subheading}</p>

            <div className="flex flex-wrap gap-4 mb-12">
              {hero.cta_label && (
                <motion.a
                  href={hero.cta_href || '#courses'}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(hero.cta_href || '#courses');
                  }}
                  className="btn-primary inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {hero.cta_label} <ArrowRight className="w-5 h-5" />
                </motion.a>
              )}
              {hero.secondary_cta_label && (
                <motion.a
                  href={hero.secondary_cta_href || '#about'}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(hero.secondary_cta_href || '#about');
                  }}
                  className="btn-secondary inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" /> {hero.secondary_cta_label}
                </motion.a>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.12, type: 'spring', stiffness: 160, damping: 14 }}
                  className="text-center sm:text-left"
                >
                  <div className="text-3xl font-bold gradient-text-gold">
                    <CountUp value={stat.value} duration={2.2} />
                  </div>
                  <div className="text-sm text-adaptive-muted">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <TiltCard className="rounded-3xl" max={8}>
            <div className="relative">
              <div className="gradient-border p-8 rounded-3xl relative z-10">
                <div className="bg-primary-950/50 dark:bg-primary-950/50 light:bg-white/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-adaptive">EUR/USD</h3>
                      <p className="text-primary-500 text-sm">Live Chart</p>
                    </div>
                    <div className="text-right">
                      <motion.div
                        className="text-2xl font-bold text-green-500 tabular-nums"
                        animate={{ opacity: [1, 0.55, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      >
                        <CountUp value="1.0842" duration={2.4} />
                      </motion.div>
                      <div className="text-green-500 text-sm">+0.21%</div>
                    </div>
                  </div>

                  <div className="h-48 relative mb-6">
                    <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,100 L50,80 L100,90 L150,60 L200,70 L250,40 L300,50 L350,30 L400,45" fill="none" stroke="#3b82f6" strokeWidth="3" className="trading-line" />
                      <path d="M0,100 L50,80 L100,90 L150,60 L200,70 L250,40 L300,50 L350,30 L400,45 L400,150 L0,150 Z" fill="url(#chartGradient)" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary-900/30 dark:bg-primary-900/30 light:bg-primary-50 rounded-xl p-3 text-center">
                      <BarChart3 className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="text-xs text-adaptive-muted">Volume</p>
                      <p className="text-sm font-bold text-adaptive">2.4M</p>
                    </div>
                    <div className="bg-primary-900/30 dark:bg-primary-900/30 light:bg-primary-50 rounded-xl p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-xs text-adaptive-muted">Trend</p>
                      <p className="text-sm font-bold text-green-500">Bullish</p>
                    </div>
                    <div className="bg-primary-900/30 dark:bg-primary-900/30 light:bg-primary-50 rounded-xl p-3 text-center">
                      <Shield className="w-5 h-5 text-accent-500 mx-auto mb-1" />
                      <p className="text-xs text-adaptive-muted">Signal</p>
                      <p className="text-sm font-bold text-accent-500">Strong</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                transition={{ opacity: { delay: 0.8 }, scale: { delay: 0.8, type: 'spring' }, y: { delay: 1.4, duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                className="absolute -top-6 -right-6 glass rounded-2xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-adaptive font-bold">
                      +<CountUp value="₦2.5M" duration={2.5} />
                    </p>
                    <p className="text-xs text-adaptive-muted">This Month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: [0, 10, 0] }}
                transition={{ opacity: { delay: 1 }, scale: { delay: 1, type: 'spring' }, y: { delay: 1.6, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
                className="absolute -bottom-4 -left-6 glass rounded-2xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <p className="text-adaptive font-bold">
                      <CountUp value="95%" duration={2.5} />
                    </p>
                    <p className="text-xs text-adaptive-muted">Success Rate</p>
                  </div>
                </div>
              </motion.div>
            </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 py-4 bg-primary-950/50 dark:bg-primary-950/50 light:bg-white/80 border-t border-primary-500/10">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {[...CURRENCY_PAIRS, ...CURRENCY_PAIRS].map((pair, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-adaptive font-medium">{pair.symbol}</span>
                <span className="text-adaptive-muted">{pair.price}</span>
                <span className={pair.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {pair.change} ({pair.changePercent})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
