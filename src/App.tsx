import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TalkToSaathiModal } from './components/TalkToSaathiModal';
import { Home } from './pages/Home';
import { Explain } from './pages/Explain';
import { SafetyCheck } from './pages/SafetyCheck';
import { Reminders } from './pages/Reminders';
import { Settings } from './pages/Settings';
import { Sparkles, Mic, CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, settings, toastMessage, setIsTalkModalOpen } = useApp();

  // Dynamic root typography scaling based on senior text size preference
  const getTextSizeClass = () => {
    switch (settings.textSize) {
      case 'xlarge':
        return 'text-lg [&_h1]:text-3xl [&_h2]:text-3xl [&_h3]:text-2xl [&_p]:text-xl [&_span]:text-base';
      case 'large':
        return 'text-base [&_h1]:text-2xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-lg [&_span]:text-base';
      default:
        return 'text-base';
    }
  };

  const highContrastClass = settings.highContrast
    ? 'contrast-125 border-stone-900 font-medium'
    : '';

  return (
    <div
      className={`min-h-screen bg-stone-50 text-stone-900 transition-all ${getTextSizeClass()} ${highContrastClass}`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'home' && <Home />}
        {activeTab === 'explain' && <Explain />}
        {activeTab === 'safety' && <SafetyCheck />}
        {activeTab === 'reminders' && <Reminders />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Floating Senior Voice Button (Quick Thumb Action) */}
      <button
        id="floating-talk-saathi-btn"
        onClick={() => setIsTalkModalOpen(true)}
        className="fixed bottom-20 right-4 sm:right-8 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-base shadow-xl border-2 border-amber-300 transition-all focus:outline-none focus:ring-4 focus:ring-amber-300 group"
        aria-label="Talk to SAATHI"
      >
        <Mic className="w-5 h-5 text-white animate-pulse" />
        <span className="hidden sm:inline">
          {settings.language === 'hi' ? 'साथी से पूछें' : 'Talk to SAATHI'}
        </span>
      </button>

      {/* Conversational Assistant Voice Modal */}
      <TalkToSaathiModal />

      {/* Bottom Accessible Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
