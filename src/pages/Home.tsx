import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  FileText,
  Camera,
  ShieldCheck,
  Bell,
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Volume2,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { speakText } from '../services/speechService';
import { SAMPLE_DOCUMENTS, SAMPLE_SCAMS } from '../data/demoData';

export const Home: React.FC = () => {
  const {
    settings,
    reminders,
    toggleReminderStatus,
    setActiveTab,
    setIsTalkModalOpen,
    openTalkWithPrompt,
    setExplainPreloadText,
    setSafetyPreloadText,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHindi = settings.language === 'hi';

  const pendingReminders = reminders.filter((r) => r.status === 'PENDING');
  const todayReminders = pendingReminders.slice(0, 3);

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setExplainPreloadText(reader.result as string);
        setActiveTab('explain');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReadAloudHome = () => {
    const speech = isHindi
      ? `नमस्ते मिसेज शर्मा। आपके पास आज 2 ज़रूरी काम हैं। पहला, ₹1,842 का बिजली बिल जो कल देय है। दूसरा, कल सुबह 11 बजे डॉक्टर का अप्वाइंटमेंट। मैं आपकी क्या सहायता करूँ?`
      : `Good morning Mrs. Sharma. You have two scheduled reminders: Your electricity bill for ₹1,842 is due tomorrow, and your doctor appointment is tomorrow at 11:00 AM. How can I help you today?`;
    speakText(speech, isHindi ? 'hi' : 'en');
  };

  // Quick Evaluator Journey triggers
  const startScamJourney = () => {
    setSafetyPreloadText(SAMPLE_SCAMS[0].content);
    setActiveTab('safety');
  };

  const startBillJourney = () => {
    setExplainPreloadText(SAMPLE_DOCUMENTS[0].content);
    setActiveTab('explain');
  };

  const startAppointmentJourney = () => {
    openTalkWithPrompt('Mujhe kal doctor ke paas jaana hai at 11 AM.');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Hidden file input for camera/picture */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleCameraUpload}
        className="hidden"
      />

      {/* Greeting Banner */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-200/90 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                SAATHI COMPANION
              </span>
              <button
                onClick={handleReadAloudHome}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 transition-colors shadow-2xs"
                title="Read aloud"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{isHindi ? 'बोलकर सुनाएँ' : 'Listen'}</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
              {isHindi ? 'शुभ प्रभात, मिसेज शर्मा 👋' : 'Good Morning, Mrs. Sharma 👋'}
            </h2>
            <p className="text-base sm:text-lg font-medium text-stone-700 mt-1">
              {isHindi ? 'आज मैं आपकी क्या सहायता कर सकता हूँ?' : 'How can I help you today?'}
            </p>
          </div>

          {/* Big Talk to SAATHI Hero Action Button */}
          <button
            id="home-talk-to-saathi-hero"
            onClick={() => setIsTalkModalOpen(true)}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-lg shadow-md flex items-center justify-center gap-3 transition-all focus:ring-4 focus:ring-amber-300 group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span>{isHindi ? '🎙 साथी से बात करें' : '🎙 TALK TO SAATHI'}</span>
          </button>
        </div>
      </div>

      {/* Primary Action Grid (Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Explain Something */}
        <button
          id="home-btn-explain"
          onClick={() => setActiveTab('explain')}
          className="p-5 rounded-3xl bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 shadow-sm flex flex-col items-center text-center gap-2.5 transition-all active:scale-98 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className="block font-extrabold text-base text-stone-900">
              {isHindi ? 'कागज़ समझिए' : 'Explain Something'}
            </span>
            <span className="block text-xs font-semibold text-stone-500 mt-0.5">
              {isHindi ? 'बिल या सूचना पत्र' : 'Bills, notices & letters'}
            </span>
          </div>
        </button>

        {/* Take a Picture */}
        <button
          id="home-btn-camera"
          onClick={() => fileInputRef.current?.click()}
          className="p-5 rounded-3xl bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 shadow-sm flex flex-col items-center text-center gap-2.5 transition-all active:scale-98 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <span className="block font-extrabold text-base text-stone-900">
              {isHindi ? 'फ़ोटो खींचिए' : 'Take a Picture'}
            </span>
            <span className="block text-xs font-semibold text-stone-500 mt-0.5">
              {isHindi ? 'कैमरे से स्कैन करें' : 'Scan physical paper'}
            </span>
          </div>
        </button>

        {/* Is This Safe? */}
        <button
          id="home-btn-safety"
          onClick={() => setActiveTab('safety')}
          className="p-5 rounded-3xl bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 shadow-sm flex flex-col items-center text-center gap-2.5 transition-all active:scale-98 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="block font-extrabold text-base text-stone-900">
              {isHindi ? 'क्या यह सुरक्षित है?' : 'Is This Safe?'}
            </span>
            <span className="block text-xs font-semibold text-stone-500 mt-0.5">
              {isHindi ? 'संदिग्ध संदेश जांचें' : 'Check scams & SMS'}
            </span>
          </div>
        </button>

        {/* My Reminders */}
        <button
          id="home-btn-reminders"
          onClick={() => setActiveTab('reminders')}
          className="p-5 rounded-3xl bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 shadow-sm flex flex-col items-center text-center gap-2.5 transition-all active:scale-98 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs relative">
            <Bell className="w-7 h-7" />
            {pendingReminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-white">
                {pendingReminders.length}
              </span>
            )}
          </div>
          <div>
            <span className="block font-extrabold text-base text-stone-900">
              {isHindi ? 'मेरे रिमाइंडर' : 'My Reminders'}
            </span>
            <span className="block text-xs font-semibold text-stone-500 mt-0.5">
              {pendingReminders.length}{' '}
              {isHindi ? 'बाकी कार्य' : 'pending tasks'}
            </span>
          </div>
        </button>
      </div>

      {/* Proactive Assistance Notification (Section 2) */}
      <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-start gap-4 shadow-xs">
        <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {isHindi ? 'साथी का सुझाव' : 'Proactive Reminder'}
            </span>
          </div>
          <p className="text-base font-bold text-stone-900">
            {isHindi
              ? 'आपका ₹1,842 का बिजली बिल कल देय है। क्या आप इसे आज ही निपटाना चाहते हैं?'
              : 'Your electricity bill of ₹1,842 is due tomorrow. Would you like help reviewing or paying it?'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={startBillJourney}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>{isHindi ? 'बिल की जानकारी देखें' : 'Review Bill Details'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S SCHEDULED TASKS (Section 6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold tracking-tight text-stone-900">
              {isHindi ? 'आज और कल के कार्य' : 'TODAY & UPCOMING'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-stone-200 text-stone-700">
              {todayReminders.length}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('reminders')}
            className="text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            <span>{isHindi ? 'सभी देखें' : 'View all'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {todayReminders.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-stone-500 font-medium">
              {isHindi ? 'कोई पेंडिंग रिमाइंडर नहीं है।' : 'No pending reminders right now.'}
            </div>
          ) : (
            todayReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-5 rounded-3xl bg-white border-2 border-stone-200 hover:border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    {rem.category === 'Bills' ? (
                      <Bell className="w-6 h-6 text-amber-700" />
                    ) : rem.category === 'Appointments' ? (
                      <Calendar className="w-6 h-6 text-sky-700" />
                    ) : (
                      <Clock className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-stone-900">
                        {rem.title}
                      </span>
                      {rem.amount && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                          {rem.currency || '₹'}
                          {rem.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {rem.description && (
                      <p className="text-sm font-medium text-stone-600 mt-0.5 line-clamp-1">
                        {rem.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs font-semibold text-stone-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rem.date}
                      </span>
                      {rem.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {rem.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => toggleReminderStatus(rem.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isHindi ? 'हो गया' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Evaluator Guided Demo Journeys Card (Section 23) */}
      <div className="p-5 rounded-3xl bg-stone-900 text-white shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-amber-400" />
          <h4 className="font-extrabold text-base tracking-tight text-white">
            Evaluator Quick Journeys (GenAI Challenge)
          </h4>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Test the connected end-to-end loops with single clicks:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Journey 1 */}
          <button
            onClick={startScamJourney}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-all group"
          >
            <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
              Journey 1
            </span>
            <span className="font-bold text-sm text-stone-100 group-hover:text-white block mt-0.5">
              Scam Protection 🛡️
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">
              Lottery SMS → Risk analysis → Notify Family
            </span>
          </button>

          {/* Journey 2 */}
          <button
            onClick={startBillJourney}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-all group"
          >
            <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
              Journey 2
            </span>
            <span className="font-bold text-sm text-stone-100 group-hover:text-white block mt-0.5">
              Bill & Reminder 📄
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">
              Analyze bill → Extract ₹1,842 → Add Reminder
            </span>
          </button>

          {/* Journey 3 */}
          <button
            onClick={startAppointmentJourney}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-all group"
          >
            <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
              Journey 3
            </span>
            <span className="font-bold text-sm text-stone-100 group-hover:text-white block mt-0.5">
              Voice Appointment 🎙️
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">
              "Doctor at 11 AM" → Intent → Confirm & Save
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
