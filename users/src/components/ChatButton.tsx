import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const ChatButton = ({ isOpen, onClick }: ChatButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-30 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
        isOpen ? 'bg-primary-600 shadow-primary-500/30' : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-500/40 glow-primary'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
        {isOpen ? <X className="w-7 h-7 text-white" /> : <MessageCircle className="w-7 h-7 text-white" />}
      </motion.div>
      
      {!isOpen && (
        <motion.span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
        </motion.span>
      )}

      {!isOpen && (
        <motion.div className="absolute inset-0 rounded-full border-2 border-primary-400" initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }} />
      )}
    </motion.button>
  );
};

export default ChatButton;
