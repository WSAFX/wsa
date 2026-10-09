import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import type { Message } from '../types';
import { sendMessage, isApiConfigured } from '../services/chatService';
import { useToastContext } from '../context/ToastContext';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}



const ChatAssistant = ({ isOpen, onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! 👋 I'm **WSA**, your forex trading assistant from Wallstreet Forex Academy.

I can help you with:
• Forex trading concepts & strategies
• Technical & fundamental analysis
• Market news and insights
• Information about our courses

What would you like to learn about today? 📈`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiConfigured = isApiConfigured();
  const { error: showError } = useToastContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendMessage(input, history);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again.';
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMsg, timestamp: new Date() };
      setMessages((prev) => [...prev, errorMessage]);
      showError('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.repeat) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-400">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '<span class="text-primary-400">•</span>')
      .replace(/\n/g, '<br />');
  };

  const quickQuestions = ['What is forex trading?', 'Best currency pairs for beginners?', 'How to manage risk?', 'Tell me about your courses'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 w-full max-w-md h-[600px] max-h-[80vh] z-50 flex flex-col rounded-3xl overflow-hidden border border-primary-500/20 shadow-2xl"
            style={{ background: 'var(--bg-secondary)' }}
            role="dialog"
            aria-modal="true"
            aria-label="AI Chat Assistant"
          >
            <div className="flex items-center justify-between p-4 border-b border-adaptive bg-primary-950/50 dark:bg-primary-950/50 light:bg-primary-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-adaptive flex items-center gap-2">WallBot <Sparkles className="w-4 h-4 text-accent-500" /></h3>
                  <p className="text-xs text-primary-500">Forex AI Assistant</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-primary-500/10 text-adaptive-muted hover:text-adaptive transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                whileTap={{ scale: 0.95 }}
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {!apiConfigured && (
              <div className="px-4 py-2 bg-accent-500/10 border-b border-accent-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-500" />
                  <p className="text-xs text-accent-500">Demo mode. Add API key in .env for full AI.</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary-500/20' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
                      {message.role === 'user' ? <User className="w-4 h-4 text-primary-500" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`chat-message ${message.role}`}>
                      <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="chat-message assistant">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-adaptive-muted mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <motion.button
                      key={question}
                      onClick={() => {
                        setInput(question);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-xs text-primary-500 hover:bg-primary-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Ask: ${question}`}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-adaptive bg-primary-950/30 dark:bg-primary-950/30 light:bg-gray-50">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about forex trading..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-adaptive-secondary border border-adaptive text-adaptive placeholder-adaptive-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 input-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Chat input"
                  aria-describedby="chat-input-help"
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
                  whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}}
                  whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
              <p id="chat-input-help" className="text-center text-xs text-adaptive-muted mt-2">Powered by AI • Forex topics only</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatAssistant;
