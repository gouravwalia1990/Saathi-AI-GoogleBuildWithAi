import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

const RELATIONS = [
  { id: 'Son', labelEn: 'Son', labelHi: 'बेटा' },
  { id: 'Daughter', labelEn: 'Daughter', labelHi: 'बेटी' },
  { id: 'Spouse', labelEn: 'Spouse', labelHi: 'जीवनसाथी' },
  { id: 'Family Member', labelEn: 'Family Member', labelHi: 'परिवार का सदस्य' },
  { id: 'Friend', labelEn: 'Friend', labelHi: 'मित्र' },
  { id: 'Other', labelEn: 'Other', labelHi: 'अन्य' },
];

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    setIsDemoMode,
    settings,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [selectedRelation, setSelectedRelation] = useState('Son');
  const [contactName, setContactName] = useState('');

  if (!isOnboardingOpen) return null;

  const isHindi = settings.language === 'hi';

  const handleStep1Continue = () => {
    setStep(2);
  };

  const handleSkipAll = () => {
    completeOnboarding({
      displayName: name.trim() || '',
      trustedContactName: '',
      trustedContactRelation: '',
    });
    setIsOnboardingOpen(false);
  };

  const handleSaveAll = () => {
    completeOnboarding({
      displayName: name.trim() || '',
      trustedContactName: contactName.trim() || '',
      trustedContactRelation: selectedRelation || 'Family Member',
    });
    setIsOnboardingOpen(false);
  };

  const handleChooseDemo = () => {
    setIsDemoMode(true);
    setIsOnboardingOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-stone-300 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            सा
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              {isHindi ? 'साथी में आपका स्वागत है' : 'Welcome to SAATHI'}
            </span>
            <h2
              id="onboarding-title"
              className="text-2xl font-black text-stone-900 tracking-tight"
            >
              {step === 1
                ? isHindi
                  ? 'नमस्ते! आपका नाम क्या है?'
                  : 'What should SAATHI call you?'
                : isHindi
                ? 'आपका विश्वसनीय पारिवारिक संपर्क'
                : 'Who can SAATHI contact for help?'}
            </h2>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 h-2 rounded-full transition-all ${
              step >= 1 ? 'bg-amber-600' : 'bg-stone-200'
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full transition-all ${
              step === 2 ? 'bg-amber-600' : 'bg-stone-200'
            }`}
          />
          <span className="text-xs font-bold text-stone-500 pl-1">
            {step} / 2
          </span>
        </div>

        {/* STEP 1: User Name */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-base font-semibold text-stone-700">
              {isHindi
                ? 'साथी आपकी बातचीत को सरल और सुरक्षित बनाता है। कृपया अपना नाम बताएं:'
                : 'SAATHI adapts technology to you. Please tell us your name so we can personalize your experience:'}
            </p>

            <div>
              <label
                htmlFor="user-name-input"
                className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5"
              >
                {isHindi ? 'आपका नाम' : 'Your Name'}
              </label>
              <input
                id="user-name-input"
                data-testid="onboarding-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStep1Continue();
                }}
                placeholder={isHindi ? 'उदा. प्रिया, गुप्ता जी, दादी' : 'e.g. Alice, Mr. Gupta, Dadi'}
                autoFocus
                className="w-full p-4 rounded-2xl border-2 border-stone-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 text-lg font-bold text-stone-900 outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                data-testid="onboarding-continue-btn"
                onClick={handleStep1Continue}
                className="flex-1 py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{isHindi ? 'आगे बढ़ें' : 'Continue'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                data-testid="onboarding-skip-step1"
                onClick={handleSkipAll}
                className="py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-sm transition-colors text-center"
              >
                {isHindi ? 'अभी छोड़ें' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Trusted Family Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-base font-semibold text-stone-700">
              {isHindi
                ? 'यदि किसी संदिग्ध संदेश या लॉटरी संदेश की जांच करनी हो, तो साथी आपके किस पारिवारिक सदस्य को अलर्ट भेज सकता है?'
                : 'If SAATHI detects a suspicious scam or urgency, who in your family should we prepare safety alerts for?'}
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                {isHindi ? 'संबंध' : 'Relationship'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RELATIONS.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    data-testid={`onboarding-relation-${rel.id.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSelectedRelation(rel.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1 text-center ${
                      selectedRelation === rel.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {selectedRelation === rel.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isHindi ? rel.labelHi : rel.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="trusted-name-input"
                className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5"
              >
                {isHindi ? 'संपर्क का नाम' : 'Contact Name'}
              </label>
              <input
                id="trusted-name-input"
                data-testid="onboarding-contact-name-input"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={isHindi ? 'उदा. राहुल, अमित, पूजा' : 'e.g. David, Rahul, Sarah'}
                className="w-full p-3.5 rounded-2xl border-2 border-stone-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 text-base font-bold text-stone-900 outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                data-testid="onboarding-save-btn"
                onClick={handleSaveAll}
                className="flex-1 py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>{isHindi ? 'प्रोफ़ाइल सहेजें' : 'Save & Get Started'}</span>
              </button>

              <button
                type="button"
                data-testid="onboarding-skip-step2"
                onClick={handleSkipAll}
                className="py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-sm transition-colors text-center"
              >
                {isHindi ? 'अभी छोड़ें' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
