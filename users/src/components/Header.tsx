import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSiteData } from '../context/SiteDataContext';
import { useSectionNav } from '../hooks/useSectionNav';

const DEFAULT_LOGO = 'https://res.cloudinary.com/dpwddkw5t/image/upload/v1768473202/wsa_logo-modified_baim58.png';

interface HeaderProps {
  onOpenChat: () => void;
}

const Header = ({ onOpenChat }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteData();
  const goTo = useSectionNav();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'About', href: '#about' },
    { label: 'Courses', href: '#courses' },
    { label: 'Batches', href: '/batches' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Pip Calculator', href: '/pip-calculator' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    goTo(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'glass-dark py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.a href="/" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center gap-3 group" whileHover={{ scale: 1.02 }} aria-label={`${settings.business_name} home`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center glow-primary">
                  <img className='w-11 h-11 rounded-full object-contain' src={settings.logo_url || DEFAULT_LOGO} alt="" />
                  
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-500 rounded-full animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-display font-bold text-adaptive">{settings.business_name.split(' ')[0]}</h1>
                <p className="text-xs text-primary-500 tracking-wider uppercase">Forex Academy</p>
              </div>
            </motion.a>

            <nav className="hidden lg:flex items-center gap-3 xl:gap-6" role="navigation" aria-label="Main navigation">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="relative text-adaptive-secondary hover:text-primary-500 transition-colors duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  aria-label={`Navigate to ${item.label} section`}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500 hover:bg-primary-500/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-pressed={theme === 'dark'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              <motion.button
                onClick={onOpenChat}
                className="px-5 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500 font-medium hover:bg-primary-500/20 hover:border-primary-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open AI chat assistant"
              >
                AI Assistant
              </motion.button>
              <motion.a
                href="#courses"
                onClick={(e) => handleNavClick(e, '#courses')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Navigate to courses section to enroll"
              >
                Enroll Now
              </motion.a>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <motion.button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                whileTap={{ scale: 0.95 }}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-pressed={theme === 'dark'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <motion.button
                className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 lg:hidden"
          >
            <div className="mx-4 glass-dark rounded-2xl p-6 space-y-4">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="block text-adaptive-secondary hover:text-primary-500 transition-colors py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  aria-label={`Navigate to ${item.label} section`}
                >
                  {item.label}
                </motion.a>
              ))}
              <div className="pt-4 border-t border-primary-500/20 space-y-3">
                <button
                  onClick={() => { onOpenChat(); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-500 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Open AI chat assistant"
                >
                  AI Assistant
                </button>
                <a
                  href="#courses"
                  onClick={(e) => handleNavClick(e, '#courses')}
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Navigate to courses section to enroll"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
