import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import ScrollProgress from './components/fx/ScrollProgress';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import { SiteDataProvider } from './context/SiteDataContext';
import { Header, Footer, ChatAssistant, ChatButton, ScrollToTop, ToastContainer } from './components';
import AnnouncementModal from './components/AnnouncementModal';
import WhatsAppWidget from './components/WhatsAppWidget';
import PipCalculatorPage from './pages/PipCalculatorPage';
import HomePage from './pages/HomePage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import BatchesPage from './pages/BatchesPage';
import BatchPage from './pages/BatchPage';
import NotFoundPage from './pages/NotFoundPage';

function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="min-h-screen bg-adaptive text-adaptive transition-colors duration-300">
      <ScrollProgress />
      <Header onOpenChat={() => setIsChatOpen(true)} />

      <Outlet />

      <Footer />

      <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ScrollToTop />
      <WhatsAppWidget />
      <AnnouncementModal />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function App() {
  return (
    // reducedMotion="user": visitors who ask their OS for less motion get fades instead of movement.
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <ToastProvider>
        <SiteDataProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="blog" element={<BlogListPage />} />
              <Route path="blog/:slug" element={<BlogPostPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="batches/:slug" element={<BatchPage />} />
              <Route path="pip-calculator" element={<PipCalculatorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </SiteDataProvider>
      </ToastProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
