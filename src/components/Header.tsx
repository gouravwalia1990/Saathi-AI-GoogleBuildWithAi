import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../services/speechService';

export const Header: React.FC = () => {
  const {
    settings,
    updateSettings,
    userProfile,
    setActiveTab,
    isTalkModalOpen,
    setIsTalkModalOpen,
    isDemoMode,
    toggleDemoMode,
    setIsDiagnosticsOpen,
  } = useApp();

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    updateSettings({ language: lang });
    if (lang === 'hi') {
      speakText('साथी में आपका स्वागत है। समझिए, पूछिए, कीजिए।', 'hi');
    } else {
      speakText('Welcome to SAATHI. Understand, ask, and act.', 'en');
    }
  };

  const handleTextSizeCycle = () => {
    const next =
      settings.textSize === 'normal'
        ? 'large'
        : settings.textSize === 'large'
        ? 'xlarge'
        : 'normal';
    updateSettings({ textSize: next });
  };

  return (
    <header className="sticky top-0 z-40 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md font-bold text-xl tracking-tight">
            <span>सा</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                SAATHI <span className="text-amber-700 text-sm font-semibold sm:inline hidden">• साथी</span>
              </h1>
              <button
                onClick={() => setIsDiagnosticsOpen(true)}
                title="Open System Diagnostics"
                aria-label="Open System Diagnostics"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors"
              >
                <Shield className="w-3 h-3 text-emerald-600" />
                Senior Safe AI
              </button>
              {userProfile.displayName && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200 transition-colors"
                  title="View Profile Settings"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>{userProfile.displayName}</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-stone-600">
              {settings.language === 'hi' ? 'समझिए। पूछिए। कीजिए।' : 'Technology that adapts to you'}
            </p>
          </div>
        </div>

        {/* Senior accessibility toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Voice Prompt Launcher */}
          <button
            id="header-talk-btn"
            data-testid="talk-to-saathi"
            onClick={() => setIsTalkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-3 focus:ring-amber-500"
            title="Talk to SAATHI"
            aria-label="Talk to SAATHI"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span className="hidden sm:inline">
              {settings.language === 'hi' ? 'बातचीत' : 'Talk'}
            </span>
          </button>

          {/* Text Size Switcher */}
          <button
            id="header-text-size-btn"
            onClick={handleTextSizeCycle}
            className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-800 text-xs sm:text-sm flex items-center gap-1 shadow-xs transition-colors"
            title="Change Text Size"
            aria-label="Change Text Size"
          >
            <span className="text-xs text-stone-400">Aa</span>
            <span className="uppercase font-extrabold text-amber-800">
              {settings.textSize === 'normal' ? 'Normal' : settings.textSize === 'large' ? 'Large' : 'XL'}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="flex rounded-lg border border-stone-300 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${
                settings.language === 'en'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${
                settings.language === 'hi'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
