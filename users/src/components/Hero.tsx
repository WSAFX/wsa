import { motion } from 'framer-motion';
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

/** Renders the heading with the admin-chosen phrase in the brand gradient. */
const HighlightedHeading = ({ heading, highlight }: { heading: string; highlight: string }) => {
  const idx = highlight ? heading.indexOf(highlight) : -1;
  if (idx < 0) return <span className="text-adaptive">{heading}</span>;
  return (
    <>
      <span className="text-adaptive">{heading.slice(0, idx)}</span>
      <span className="gradient-text">{highlight}</span>
      <span className="text-adaptive">{heading.slice(idx + highlight.length)}</span>
    </>
  );
};

const Hero = () => {
  const { hero: liveHero, about } = useSiteData();
  const hero = liveHero ?? DEFAULT_HERO;
  const stats = about?.stats?.length ? about.stats : STATS;
  const goTo = useSectionNav();

  return (
    <section id="home" className="relative min-h-screen overflow-hidden hero-gradient">
      <div className="absolute inset-0 grid-bg opacity-50" />
      
      <div className="absolute top-1/4 left-10 opacity-20 animate-float">
        <svg width="60" height="120" viewBox="0 0 60 120">
          <rect x="25" y="20" width="10" height="80" fill="#3b82f6" rx="2" />
          <line x1="30" y1="10" x2="30" y2="20" stroke="#3b82f6" strokeWidth="2" />
          <line x1="30" y1="100" x2="30" y2="110" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      </div>
      <div className="absolute top-1/3 right-20 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
        <svg width="60" height="100" viewBox="0 0 60 100">
          <rect x="25" y="30" width="10" height="50" fill="#ef4444" rx="2" />
          <line x1="30" y1="20" x2="30" y2="30" stroke="#ef4444" strokeWidth="2" />
          <line x1="30" y1="80" x2="30" y2="90" stroke="#ef4444" strokeWidth="2" />
        </svg>
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />

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
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center sm:text-left"
                >
                  <div className="text-3xl font-bold gradient-text-gold">{stat.value}</div>
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
            <div className="relative">
              <div className="gradient-border p-8 rounded-3xl relative z-10">
                <div className="bg-primary-950/50 dark:bg-primary-950/50 light:bg-white/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-adaptive">EUR/USD</h3>
                      <p className="text-primary-500 text-sm">Live Chart</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">1.0842</div>
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

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="absolute -top-6 -right-6 glass rounded-2xl p-4 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-adaptive font-bold">+₦2.5M</p>
                    <p className="text-xs text-adaptive-muted">This Month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="absolute -bottom-4 -left-6 glass rounded-2xl p-4 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <p className="text-adaptive font-bold">95%</p>
                    <p className="text-xs text-adaptive-muted">Success Rate</p>
                  </div>
                </div>
              </motion.div>
            </div>
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
