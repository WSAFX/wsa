import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { whatsappLink } from '../lib/whatsapp';

const WhatsAppIcon = ({ className = 'h-7 w-7' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.004 3C8.82 3 3.004 8.817 3.004 16c0 2.29.6 4.528 1.74 6.5L3 29l6.687-1.716A12.94 12.94 0 0 0 16.004 29C23.186 29 29 23.183 29 16S23.186 3 16.004 3Zm0 23.6c-1.98 0-3.92-.533-5.613-1.54l-.402-.24-3.967 1.018 1.06-3.866-.262-.416A10.55 10.55 0 0 1 5.4 16c0-5.847 4.757-10.6 10.604-10.6S26.6 10.153 26.6 16s-4.75 10.6-10.596 10.6Zm5.81-7.94c-.318-.16-1.884-.93-2.176-1.036-.292-.106-.504-.16-.716.16-.212.318-.822 1.036-1.008 1.248-.185.212-.371.239-.69.08-.318-.16-1.343-.495-2.558-1.578-.945-.843-1.583-1.884-1.769-2.202-.185-.318-.02-.49.14-.649.143-.142.318-.371.477-.557.16-.185.212-.318.318-.53.106-.212.053-.398-.026-.557-.08-.16-.716-1.726-.981-2.363-.258-.62-.52-.536-.716-.546l-.61-.01a1.17 1.17 0 0 0-.849.398c-.292.318-1.114 1.088-1.114 2.654s1.14 3.079 1.3 3.29c.159.213 2.245 3.428 5.44 4.807.76.328 1.353.524 1.816.67.763.243 1.457.209 2.006.127.612-.091 1.884-.77 2.15-1.513.265-.743.265-1.38.185-1.513-.079-.133-.29-.212-.61-.371Z" />
  </svg>
);

/**
 * Floating WhatsApp button (bottom-left; WallBot and scroll-to-top sit bottom-right).
 * The number, greeting and pre-filled message are set in Admin → Business & SEO.
 */
const WhatsAppWidget = () => {
  const { settings } = useSiteData();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);

  const link = whatsappLink(settings.whatsapp, settings.whatsapp_message);

  // Show the greeting bubble once, a little after the page settles.
  useEffect(() => {
    if (!link || !settings.whatsapp_widget_enabled) return;
    const t = setTimeout(() => setNudge(true), 6000);
    return () => clearTimeout(t);
  }, [link, settings.whatsapp_widget_enabled]);

  if (!link || !settings.whatsapp_widget_enabled) return null;

  const showBubble = open || nudge;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            role="dialog"
            aria-label="Chat on WhatsApp"
          >
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
              <WhatsAppIcon className="h-6 w-6" />
              <div className="flex-1 leading-tight">
                <p className="text-sm font-semibold">{settings.business_name}</p>
                <p className="text-[11px] text-white/75">Typically replies within minutes</p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setNudge(false);
                }}
                aria-label="Close WhatsApp chat"
                className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-[#ECE5DD] p-4">
              <p className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                {settings.whatsapp_greeting || 'Hi there! How can we help you?'}
              </p>
            </div>
            <div className="p-3">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <WhatsAppIcon className="h-5 w-5" /> Start chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => {
          setOpen((o) => !o);
          setNudge(false);
        }}
        aria-label={showBubble ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        aria-expanded={showBubble}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {!showBubble && <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />}
        <WhatsAppIcon />
      </motion.button>
    </div>
  );
};

export default WhatsAppWidget;
