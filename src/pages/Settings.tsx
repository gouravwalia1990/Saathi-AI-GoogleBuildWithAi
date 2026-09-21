import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings as SettingsIcon,
  Globe,
  Type,
  Users,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  User,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { speakText } from '../services/speechService';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    userProfile,
    updateUserProfile,
    sessionId,
    isDemoMode,
    setIsDemoMode,
    resetSessionData,
    resetDemoData,
    showToast,
  } = useApp();

  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [contactName, setContactName] = useState(userProfile.trustedContactName || '');
  const [contactPhone, setContactPhone] = useState(userProfile.trustedContactPhone || '');
  const [contactRelation, setContactRelation] = useState(userProfile.trustedContactRelation || 'Family Member');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const isHindi = settings.language === 'hi';

  const handleSaveProfile = () => {
    updateUserProfile({
      displayName: displayName.trim(),
      trustedContactName: contactName.trim(),
      trustedContactRelation: contactRelation.trim(),
      trustedContactPhone: contactPhone.trim(),
    });
    setIsEditingProfile(false);
    showToast(isHindi ? 'प्रोफ़ाइल सहेज ली गई' : 'Profile updated successfully');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-stone-100 border-2 border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
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
      </div>

      {/* 1. User Profile & Personalization (P0 Isolation) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-extrabold text-stone-900">
              {isHindi ? 'आपकी प्रोफ़ाइल और निजी जानकारी' : 'Profile & Personalization'}
            </h3>
          </div>
          {!isEditingProfile && (
            <button
              data-testid="settings-edit-profile-btn"
              onClick={() => {
                setDisplayName(userProfile.displayName || '');
                setContactName(userProfile.trustedContactName || '');
                setContactRelation(userProfile.trustedContactRelation || 'Family Member');
                setContactPhone(userProfile.trustedContactPhone || '');
                setIsEditingProfile(true);
              }}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200"
            >
              {isHindi ? 'संपादित करें' : 'Edit Profile'}
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isHindi ? 'आपका नाम (SAATHI आपको क्या कहे)' : 'Your Name (What SAATHI calls you)'}
              </label>
              <input
                data-testid="settings-user-name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isHindi ? 'उदा. प्रिया, गुप्ता जी' : 'e.g. Alice, Mr. Gupta'}
                className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isHindi ? 'विश्वसनीय संपर्क नाम' : 'Trusted Contact Name'}
                </label>
                <input
                  data-testid="settings-contact-name-input"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={isHindi ? 'उदा. राहुल, पूजा' : 'e.g. David, Sarah'}
                  className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isHindi ? 'संबंध' : 'Relationship'}
                </label>
                <input
                  data-testid="settings-contact-relation-input"
                  type="text"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  placeholder={isHindi ? 'उदा. बेटा, बेटी, मित्र' : 'e.g. Son, Daughter, Friend'}
                  className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isHindi ? 'फ़ोन नंबर' : 'Phone Number'}
                </label>
                <input
                  data-testid="settings-contact-phone-input"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-3 rounded-xl border-2 border-stone-300 font-bold text-sm outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                data-testid="settings-save-contact-btn"
                onClick={handleSaveProfile}
                className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-colors"
              >
                {isHindi ? 'सहेजें' : 'Save Profile'}
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                {isHindi ? 'उपयोगकर्ता नाम' : 'User Display Name'}
              </span>
              <p className="text-lg font-black text-stone-900">
                {userProfile.displayName || (
                  <span className="text-stone-400 italic font-semibold">
                    {isHindi ? 'सेट नहीं है' : 'Not set yet'}
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                {isHindi ? 'विश्वसनीय पारिवारिक संपर्क' : 'Trusted Family Contact'}
              </span>
              <p className="text-base font-black text-stone-900">
                {userProfile.trustedContactName ? (
                  `${userProfile.trustedContactName} (${userProfile.trustedContactRelation || 'Contact'})`
                ) : (
                  <span className="text-stone-400 italic font-semibold">
                    {isHindi ? 'सेट नहीं है' : 'Not set yet'}
                  </span>
                )}
              </p>
              {userProfile.trustedContactPhone && (
                <span className="text-xs font-semibold text-stone-600 block mt-0.5">
                  {userProfile.trustedContactPhone}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Isolation Session Info */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span>
            {isDemoMode ? (
              <span className="font-bold text-amber-800">
                Mode: Demo Persona (Mr. Sharma Fixture)
              </span>
            ) : (
              <span>
                Isolated Session: <code className="font-mono text-stone-700 font-bold">{sessionId}</code>
              </span>
            )}
          </span>
          <span className="text-stone-400">Client-Side Namespaced Isolation</span>
        </div>
      </div>

      {/* 2. Language Option */}
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

      {/* 3. Text Size Control */}
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
          <button
            type="button"
            onClick={() => updateSettings({ textSize: 'normal' })}
            className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
              settings.textSize === 'normal'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            {isHindi ? 'सामान्य' : 'Normal'}
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ textSize: 'large' })}
            className={`py-3 rounded-2xl font-bold text-base border-2 transition-all ${
              settings.textSize === 'large'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            {isHindi ? 'बड़ा' : 'Large'}
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ textSize: 'xlarge' })}
            className={`py-3 rounded-2xl font-bold text-lg border-2 transition-all ${
              settings.textSize === 'xlarge'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            {isHindi ? 'अति बड़ा' : 'Extra Large'}
          </button>
        </div>
      </div>

      {/* 4. Accessibility Toggles */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
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

      {/* 5. Trust & Privacy Guarantee */}
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

      {/* 6. Session Isolation & Reset Actions */}
      <div className="p-5 rounded-3xl bg-white border-2 border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-extrabold text-stone-900 text-base block">
            {isHindi ? 'मेरा सत्र डेटा साफ़ करें' : 'Clear My Session & Start Fresh'}
          </span>
          <span className="text-xs font-medium text-stone-500">
            {isHindi
              ? 'वर्तमान सत्र के सभी व्यक्तिगत रिमाइंडर व सेटिंग्स साफ़ करें'
              : 'Erase current isolated session data and restart onboarding'}
          </span>
        </div>
        <button
          data-testid="settings-reset-session-btn"
          onClick={resetSessionData}
          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>
            {isHindi ? 'सत्र साफ़ करें' : 'Clear My Session'}
          </span>
        </button>
      </div>

      {/* Philosophy closing message */}
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
