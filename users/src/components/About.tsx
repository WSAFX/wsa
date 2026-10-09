import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Users, Trophy, BookOpen, CheckCircle } from 'lucide-react';
import { COMPANY_INFO, TEAM_MEMBERS } from '../data/constants';
import { useSiteData } from '../context/SiteDataContext';
import { framedUrl } from '../lib/frame';

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { about } = useSiteData();
  const team = about?.team?.length
    ? about.team.map((m) => ({ name: m.name, role: m.role, image: m.image_url ?? null }))
    : TEAM_MEMBERS;
  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('');

  const features = [
    { icon: Target, title: 'Expert-Led Training', description: 'Learn from traders with proven track records and years of market experience.' },
    { icon: Users, title: 'Community Support', description: 'Join a thriving community of traders who support and learn from each other.' },
    { icon: Trophy, title: 'Proven Results', description: '95% of our graduates report significant improvement in their trading performance.' },
    { icon: BookOpen, title: 'Comprehensive Curriculum', description: 'From basics to advanced strategies, our courses cover everything you need.' },
  ];

  const highlights = [
    'Hands-on live trading sessions',
    'One-on-one mentorship available',
    'Access to proprietary trading tools',
    'Lifetime community access',
    'Weekly market analysis sessions',
    'Certificate upon completion',
  ];

  return (
    <section id="about" className="relative py-24 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 dark:from-primary-950/20 light:from-primary-50/50 to-transparent" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium mb-4">
            About Us
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-adaptive mb-6">
            Why Choose <span className="gradient-text">Wallstreet</span>?
          </h2>
          <p className="text-xl text-adaptive-secondary max-w-3xl mx-auto">
            {about?.subheading || `${COMPANY_INFO.name} is Nigeria's leading forex education institution.`}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-adaptive-card border border-adaptive transition-all duration-500 card-hover">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-adaptive mb-2">{feature.title}</h3>
                <p className="text-adaptive-secondary">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="photo-frame aspect-[4/3] rounded-2xl overflow-hidden">
                  <img src="https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972427/image11_crfjic.jpg" alt="Trading classroom" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
                </div>
                <div className="photo-frame aspect-square rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop" alt="Market analysis" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="photo-frame aspect-square rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=400&fit=crop" alt="Trading charts" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
                </div>
                <div className="photo-frame aspect-[4/3] rounded-2xl overflow-hidden">
                  <img src="https://res.cloudinary.com/dpwddkw5t/image/upload/v1767972428/image3_bdpwuw.jpg" alt="Success celebration" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -right-6 glass rounded-2xl p-6 glow-primary"
            >
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-gold">15+</div>
                <div className="text-sm text-adaptive-muted">Years Experience</div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl font-display font-bold text-adaptive mb-6">
              {about?.headline || 'Transform Your Financial Future with Expert Guidance'}
            </h3>
            {about?.body_html ? (
              <div
                className="rich-text text-adaptive-secondary mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: about.body_html }}
              />
            ) : (
            <>
            <p className="text-adaptive-secondary mb-6 leading-relaxed">
              Founded by <span className="text-primary-500 font-medium">{COMPANY_INFO.ceo}</span>, 
              Wallstreet Forex Academy has been at the forefront of forex education in Nigeria since 2009.
            </p>
            <p className="text-adaptive-secondary mb-8 leading-relaxed">
              We've trained over 5,000 students, with our graduates collectively achieving over 
              ₦2 billion in trading profits.
            </p>
            </>
            )}

            <div className="grid grid-cols-2 gap-3 mb-8">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={highlight}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <span className="text-sm text-adaptive-secondary">{highlight}</span>
                </motion.div>
              ))}
            </div>

            <motion.a href="#courses" className="btn-primary inline-flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Explore Our Courses
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-3xl font-display font-bold text-adaptive text-center mb-12">
            Meet Our <span className="gradient-text">Team</span>
          </h3>
          {/* Flex-wrap keeps 1, 2 or 3 people centred instead of leaving empty grid columns. */}
          <div className="flex flex-wrap justify-center gap-6">
            {team.map((member, index) => (
              <motion.figure
                key={`${member.name}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + index * 0.08 }}
                className="group w-[calc(50%-0.75rem)] sm:w-60 lg:w-64"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-adaptive bg-adaptive-card shadow-xl shadow-primary-950/20">
                  {member.image ? (
                    <img
                      src={framedUrl(member.image, { aspect: '3:4', crop: 'fill', gravity: 'faces', width: 600 })}
                      alt={`${member.name}, ${member.role}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 font-display text-5xl font-bold text-white/90">
                      {initials(member.name)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-950/95 via-dark-950/60 to-transparent p-4 pt-16">
                    <figcaption>
                      <p className="text-lg font-bold leading-tight text-white">{member.name}</p>
                      <p className="mt-1 text-sm font-medium text-accent-400">{member.role}</p>
                    </figcaption>
                  </div>
                </div>
              </motion.figure>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
