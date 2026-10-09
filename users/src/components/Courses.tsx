import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Clock, Check, ArrowRight, Sparkles } from 'lucide-react';
import { COURSES } from '../data/constants';
import { useApi } from '../hooks/useApi';
import { useSectionNav } from '../hooks/useSectionNav';
import { useSiteData } from '../context/SiteDataContext';
import { whatsappLink } from '../lib/whatsapp';
import type { CourseItem } from '../types';
import TiltCard from './fx/TiltCard';
import CountUp from './fx/CountUp';

// Shown only if the API is unreachable.
const FALLBACK: CourseItem[] = COURSES.map((c, i) => ({
  ...c,
  id: String(c.id),
  highlighted: i === 2,
  badge_text: 'Most Popular',
  cta_label: 'Enroll Now',
  cta_href: '',
}));

const Courses = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { data, loading } = useApi<CourseItem[]>('/courses');
  const { settings } = useSiteData();
  const goTo = useSectionNav();
  const courses = data ?? (loading ? null : FALLBACK);

  // Custom link if the admin set one, otherwise WhatsApp with the course pre-filled.
  const enroll = (course: CourseItem) => {
    const href = course.cta_href.trim();
    if (href) return { href, external: /^https?:\/\//.test(href) };
    const wa = whatsappLink(settings.whatsapp, `Hello, I'm interested in the ${course.title} course. Please share the next batch details.`);
    return wa ? { href: wa, external: true } : { href: '#contact', external: false };
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'Intermediate': return 'text-accent-500 bg-accent-500/10 border-accent-500/30';
      case 'Advanced': return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <section id="courses" className="relative py-24 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Our Programs
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-adaptive mb-6">
            Choose Your <span className="gradient-text">Path to Success</span>
          </h2>
          <p className="text-xl text-adaptive-secondary max-w-3xl mx-auto">
            From complete beginners to experienced traders, we have a program for every skill level
          </p>
        </motion.div>

        {!courses && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[560px] rounded-3xl bg-primary-500/10 animate-pulse" />
            ))}
          </div>
        )}
        <div className={`grid md:grid-cols-2 gap-8 ${courses && courses.length % 3 === 1 && courses.length > 1 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {(courses ?? []).map((course, index) => {
            const cta = enroll(course);
            return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 120, rotateX: 35, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 1200 }}
              className="group relative"
            >
              <TiltCard className="h-full rounded-3xl" max={7}>
              {course.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-bold whitespace-nowrap shadow-lg shadow-accent-500/40 animate-pulse">{course.badge_text || 'Most Popular'}</span>
                </div>
              )}
              <div className={`h-full p-8 rounded-3xl border transition-all duration-500 card-hover ${course.highlighted ? 'bg-gradient-to-b from-primary-900/50 to-primary-950/50 border-primary-500/30' : 'bg-adaptive-card border-adaptive'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(course.level)}`}>{course.level}</span>
                  <div className="flex items-center gap-2 text-adaptive-muted">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{course.duration}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-adaptive mb-3">{course.title}</h3>
                <p className="text-adaptive-secondary mb-6">{course.description}</p>
                <div className="mb-6"><span className="text-4xl font-bold gradient-text-gold"><CountUp value={course.price} duration={1.8} /></span></div>
                <ul className="space-y-3 mb-8">
                  {course.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary-500" />
                      </div>
                      <span className="text-adaptive-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.a
                  href={cta.href}
                  {...(cta.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {
                        onClick: (e: React.MouseEvent) => {
                          e.preventDefault();
                          goTo(cta.href);
                        },
                      })}
                  className={`w-full py-4 rounded-xl font-semibold text-center flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    course.highlighted
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
                      : 'bg-primary-500/10 border border-primary-500/30 text-primary-500 hover:bg-primary-500/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={`Enroll in ${course.title} course`}
                >
                  {course.cta_label || 'Enroll Now'} <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
              </TiltCard>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Courses;
