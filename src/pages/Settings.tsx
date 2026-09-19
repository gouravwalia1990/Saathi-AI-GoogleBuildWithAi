import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings as SettingsIcon,
  Globe,
  Type,
  Eye,
  Volume2,
  Users,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { speakText } from '../services/speechService';
import { Language, TextSize } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetDemoData, showToast } = useApp();

  const [contactName, setContactName] = useState(settings.trustedContactName);
  const [contactPhone, setContactPhone] = useState(settings.trustedContactPhone);
  const [contactRelation, setContactRelation] = useState(settings.trustedContactRelation);
  const [isEditingContact, setIsEditingContact] = useState(false);

  const isHindi = settings.language === 'hi';

  const handleSaveContact = () => {
    updateSettings({
      trustedContactName: contactName.trim() || 'Rahul Sharma',
      trustedContactPhone: contactPhone.trim() || '+91 98765 43210',
      trustedContactRelation: contactRelation.trim() || 'Son',
    });
    setIsEditingContact(false);
    showToast(isHindi ? 'पारिवारिक संपर्क सहेजा गया' : 'Family contact saved');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-stone-100 border-2 border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-xs shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {isHindi ? 'सेटिंग्स और सुगमता' : 'Settings & Accessibility'}
          </h2>
          <p className="text-sm font-semibold text-stone-600">
            {isHindi
              ? 'अक्षर का आकार, भाषा, और सुरक्षा संपर्क प्रबंधित करें'
              : 'Customize text size, language, and trusted family contact'}
          </p>
        </div>
      </div>

      {/* 1. Language Option */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-extrabold text-stone-900">
            {isHindi ? 'भाषा चयन (Language)' : 'Language'}
          </h3>
        </div>
        <p className="text-sm font-medium text-stone-600">
          {isHindi
            ? 'अपनी पसंद की भाषा चुनें। साथी हिंदी, अंग्रेजी और हिंग्लिश दोनों में काम करता है।'
            : 'Choose your primary display and voice language.'}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              updateSettings({ language: 'en' });
              speakText('Language set to English', 'en');
            }}
            className={`py-3.5 px-4 rounded-2xl font-black text-base border-2 transition-all flex items-center justify-center gap-2 ${
              settings.language === 'en'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            {settings.language === 'en' && <CheckCircle2 className="w-5 h-5" />}
            <span>English</span>
          </button>

          <button
            type="button"
            onClick={() => {
              updateSettings({ language: 'hi' });
              speakText('भाषा हिंदी में सेट की गई', 'hi');
            }}
            className={`py-3.5 px-4 rounded-2xl font-black text-base border-2 transition-all flex items-center justify-center gap-2 ${
              settings.language === 'hi'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            {settings.language === 'hi' && <CheckCircle2 className="w-5 h-5" />}
            <span>हिंदी (Hindi)</span>
          </button>
        </div>
      </div>

      {/* 2. Text Size Control (Section 17 & 18) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-extrabold text-stone-900">
            {isHindi ? 'अक्षर का आकार (Text Size)' : 'Text Size'}
          </h3>
        </div>
        <p className="text-sm font-medium text-stone-600">
          {isHindi
            ? 'आंखों की सुविधा के लिए लिखावट को बड़ा या बहुत बड़ा करें।'
            : 'Make all text easier to read across the entire application.'}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {(['normal', 'large', 'xlarge'] as TextSize[]).map((size) => {
            const isSelected = settings.textSize === size;
            const labels = {
              normal: isHindi ? 'सामान्य' : 'Normal',
              large: isHindi ? 'बड़ा' : 'Large',
              xlarge: isHindi ? 'अति विशाल' : 'Extra Large',
            };
            return (
              <button
                key={size}
                type="button"
                onClick={() => updateSettings({ textSize: size })}
                className={`py-3.5 px-2 rounded-2xl font-extrabold text-sm sm:text-base border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
                }`}
              >
                <span className={size === 'xlarge' ? 'text-lg' : size === 'large' ? 'text-base' : 'text-sm'}>
                  Aa
                </span>
                <span>{labels[size]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2b. Reminder Preference (Section 10) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-extrabold text-stone-900">
            {isHindi ? 'रिमाइंडर प्राथमिकता (Reminder Timing)' : 'Reminder Schedule Preference'}
          </h3>
        </div>
        <p className="text-sm font-medium text-stone-600">
          {isHindi
            ? 'बिल और अप्वाइंटमेंट के लिए साथी आपको कब याद दिलाए?'
            : 'Choose default timing for proactive bill and task reminders.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {[
            { id: '1_day_before', en: '1 Day Before', hi: '1 दिन पहले' },
            { id: 'same_day', en: 'Same Day', hi: 'उसी दिन सुबह' },
            { id: '2_days_before', en: '2 Days Before', hi: '2 दिन पहले' },
          ].map((pref) => {
            const isSelected = (settings.reminderPreference || '1_day_before') === pref.id;
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => {
                  updateSettings({ reminderPreference: pref.id as any });
                  showToast(isHindi ? 'रिमाइंडर समय प्राथमिकता अपडेट की गई' : 'Reminder preference updated');
                }}
                className={`py-3 px-3 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
                <span>{isHindi ? pref.hi : pref.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Accessibility Toggles */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-extrabold text-stone-900">
            {isHindi ? 'सुगमता एवं कंट्रास्ट' : 'Accessibility Features'}
          </h3>
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between py-2 border-b border-stone-100">
          <div>
            <span className="font-extrabold text-stone-900 text-base block">
              {isHindi ? 'हाई कंट्रास्ट मोड' : 'High Contrast Mode'}
            </span>
            <span className="text-xs font-semibold text-stone-500">
              {isHindi ? 'गहरे बॉर्डर और अधिक स्पष्ट टेक्स्ट' : 'Deep borders and bold contrast'}
            </span>
          </div>
          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 ${
              settings.highContrast ? 'bg-amber-600' : 'bg-stone-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto Read Aloud */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="font-extrabold text-stone-900 text-base block">
              {isHindi ? 'स्वचालित बोलकर सुनाएँ' : 'Audio Speech Guidance'}
            </span>
            <span className="text-xs font-semibold text-stone-500">
              {isHindi ? 'परिणाम आते ही बोलकर सुनाए' : 'Speak aloud explanations automatically'}
            </span>
          </div>
          <button
            onClick={() => updateSettings({ autoReadAloud: !settings.autoReadAloud })}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 ${
              settings.autoReadAloud ? 'bg-amber-600' : 'bg-stone-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.autoReadAloud ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Trusted Family Member Support (Section 16 & 17) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-extrabold text-stone-900">
              {isHindi ? 'विश्वसनीय पारिवारिक संपर्क' : 'Trusted Family Member'}
            </h3>
          </div>
          {!isEditingContact && (
            <button
              onClick={() => setIsEditingContact(true)}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200"
            >
              {isHindi ? 'बदलें' : 'Edit'}
            </button>
          )}
        </div>

        {isEditingContact ? (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Relation
                </label>
                <input
                  type="text"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveContact}
                className="py-2.5 px-4 rounded-xl bg-amber-700 text-white font-bold text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingContact(false)}
                className="py-2.5 px-4 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-base font-extrabold text-stone-900 block">
                {settings.trustedContactName} ({settings.trustedContactRelation})
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {settings.trustedContactPhone} • Simulated alerts for high-risk scam checks
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Privacy & Trust Guarantees (Section 17 & Principle 5) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
        <div className="flex items-center gap-2 text-stone-900 font-black text-base">
          <ShieldCheck className="w-6 h-6 text-amber-700" />
          <span>{isHindi ? 'गोपनीयता एवं सुरक्षा नीति' : 'Trust & Privacy Guarantee'}</span>
        </div>

        <div className="space-y-2 text-sm font-semibold text-stone-800">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              {isHindi
                ? 'साथी (SAATHI) आपसे कभी भी आपका OTP, बैंक पासवर्ड, एटीएम पिन या कार्ड CVV नहीं माँगता है।'
                : 'SAATHI does not need your OTP, password, PIN, or banking credentials.'}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              {isHindi
                ? 'एआई द्वारा दी गई जानकारी में त्रुटि हो सकती है। किसी भी महत्वपूर्ण वित्तीय या कानूनी निर्णय से पहले स्वतंत्र रूप से पुष्टि करें।'
                : 'AI-generated information can contain mistakes. Verify important financial, legal, or official information.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Demo Data Reset (Evaluator utility) */}
      <div className="p-5 rounded-3xl bg-white border-2 border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-extrabold text-stone-900 text-base block">
            {isHindi ? 'डेमो डेटा रीसेट करें' : 'Reset Demo Application State'}
          </span>
          <span className="text-xs font-medium text-stone-500">
            {isHindi
              ? 'पुनः आरंभिक स्थिति में लौटने के लिए सभी रिमाइंडर व सेटिंग्स रीसेट करें'
              : 'Restore initial pre-seeded reminders and test cases for evaluation'}
          </span>
        </div>
        <button
          onClick={resetDemoData}
          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isHindi ? 'डेटा रीसेट' : 'Reset Demo Data'}</span>
        </button>
      </div>

      {/* Philosophy closing message (Section 33 & 34) */}
      <div className="text-center pt-4 pb-2 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          SAATHI AI • A Trusted Digital Companion
        </p>
        <p className="text-xs font-semibold text-stone-500 italic">
          "Technology should not ask seniors to become more technical. Technology should become more human."
        </p>
      </div>
    </div>
  );
};
