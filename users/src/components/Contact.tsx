import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Facebook, Linkedin, Youtube, Navigation } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { whatsappLink } from '../lib/whatsapp';

const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7214445545865!2d7.491478074601133!3d6.429819993561279!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1044a160e7afb3c5%3A0x17cacc7004286e00!2sWALL%20STREET%20FOREX%20ACADEMY%20ENUGU!5e0!3m2!1sen!2sng!4v1767795373261!5m2!1sen!2sng';

/** Contact details, quick actions (WhatsApp / call / directions) and the map. No form. */
const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { settings } = useSiteData();

  const wa = whatsappLink(settings.whatsapp, settings.whatsapp_message);
  const tel = settings.phone ? `tel:${settings.phone.replace(/[^\d+]/g, '')}` : null;

  const contactInfo = [
    { icon: MapPin, label: 'Address', value: [settings.address, settings.city].filter(Boolean).join(', ') },
    { icon: Phone, label: 'Phone', value: settings.phone, href: tel },
    { icon: Mail, label: 'Email', value: settings.email, href: settings.email ? `mailto:${settings.email}` : null },
    { icon: Clock, label: 'Hours', value: settings.business_hours },
  ].filter((i) => i.value);

  const socialLinks = [
    { icon: Instagram, href: settings.instagram_url, label: 'Instagram' },
    { icon: Facebook, href: settings.facebook_url, label: 'Facebook' },
    { icon: Linkedin, href: settings.linkedin_url, label: 'LinkedIn' },
    { icon: Youtube, href: settings.youtube_url, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <section id="contact" className="relative py-24 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4" />
            Get In Touch
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-adaptive mb-6">
            Start Your <span className="gradient-text">Journey Today</span>
          </h2>
          <p className="text-xl text-adaptive-secondary max-w-3xl mx-auto">
            Visit the academy, give us a call or send us a WhatsApp message. We usually reply within minutes.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="space-y-5">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-adaptive-muted text-sm">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-adaptive font-medium hover:text-primary-500 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-adaptive font-medium">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 font-semibold text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </a>
              )}
              {tel && (
                <a href={tel} className="btn-secondary flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" /> Call us
                </a>
              )}
              {settings.google_maps_url && (
                <a
                  href={settings.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  <Navigation className="w-5 h-5" /> Get directions
                </a>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-adaptive mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-500 hover:bg-primary-500/20 transition-all"
                      whileHover={{ scale: 1.1 }}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 min-h-[360px] rounded-3xl overflow-hidden border border-adaptive"
          >
            <iframe
              src={MAP_EMBED}
              title={`${settings.business_name} on Google Maps`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 360 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="opacity-90 hover:opacity-100 transition-opacity duration-500"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
