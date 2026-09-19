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
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { speakText } from '../services/speechService';
import { SAMPLE_DOCUMENTS, SAMPLE_SCAMS } from '../data/demoData';

export const Home: React.FC = () => {
  const {
    settings,
    reminders,
    safetyChecks,
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

  // Derive actual state for My Day (Section 6)
  const importantBills = pendingReminders.filter((r) => r.category === 'Bills');
  const appointments = pendingReminders.filter((r) => r.category === 'Appointments');
  const highRiskSafetyItems = safetyChecks.filter((s) => s.riskLevel === 'HIGH');

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

  // My Day audio walkthrough
  const handleWalkthroughMyDay = () => {
    const billSummary =
      importantBills.length > 0
        ? isHindi
          ? `आपके पास एक बिजली का बिल है, ₹${importantBills[0].amount || 1842}, जो ${importantBills[0].date} को देय है।`
          : `You have a bill for ${importantBills[0].title}, amount ₹${importantBills[0].amount || 1842}, due ${importantBills[0].date}.`
        : '';

    const apptSummary =
      appointments.length > 0
        ? isHindi
          ? `आपका अगला अप्वाइंटमेंट है: ${appointments[0].title}, ${appointments[0].date} को सुबह ${appointments[0].time || '11:00 AM'} बजे।`
          : `Your next appointment is: ${appointments[0].title}, ${appointments[0].date} at ${appointments[0].time || '11:00 AM'}.`
        : '';

    const safetySummary =
      highRiskSafetyItems.length > 0
        ? isHindi
          ? `सुरक्षा ध्यान दें: 1 संदिग्ध संदेश की समीक्षा की गई है।`
          : `Safety alert: 1 suspicious message needs your attention.`
        : isHindi
        ? `सभी सुरक्षा संदेश सुरक्षित प्रतीत होते हैं।`
        : `Your digital safety status is clear.`;

    const speech = isHindi
      ? `नमस्ते मिसेज शर्मा। आज के आपके मुख्य कार्य: ${billSummary} ${apptSummary} ${safetySummary} क्या आप किसी कार्य में मेरी मदद चाहते हैं?`
      : `Good morning Mrs. Sharma. Here is what matters today: ${billSummary} ${apptSummary} ${safetySummary} Would you like help with any of these?`;

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
                SAATHI COMPANION • साथी
              </span>
              <button
                onClick={handleWalkthroughMyDay}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-300 transition-colors shadow-2xs"
                title="Walk through today's tasks"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{isHindi ? 'आज का दिन सुनें' : 'Audio Briefing'}</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
              {isHindi ? 'नमस्ते, मिसेज शर्मा 👋' : 'Good Morning, Mrs. Sharma 👋'}
            </h2>
            <p className="text-base sm:text-lg font-medium text-stone-700 mt-1">
              {isHindi
                ? 'तकनीक जो आपके अनुसार ढले, न कि आप तकनीक के अनुसार।'
                : 'Technology that adapts to you, not the other way around.'}
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

      {/* MY DAY: Proactive Briefing Section (V2 Section 6) */}
      <div
        id="my-day-card"
        className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-md space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              {isHindi ? 'मेरा दिन • दैनिक समीक्षा' : 'MY DAY • PROACTIVE BRIEFING'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {isHindi ? 'यहाँ आज की सबसे ज़रूरी बातें हैं' : "Here's what matters today"}
            </h3>
          </div>

          <button
            id="my-day-walkthrough-btn"
            onClick={handleWalkthroughMyDay}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-sm border border-amber-300 flex items-center gap-2 shadow-2xs transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-amber-800" />
            <span>
              {isHindi
                ? 'क्या मैं आपको आज के काम समझा दूँ?'
                : 'Walk me through today'}
            </span>
          </button>
        </div>

        {/* Real Application State Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Important Bill Item */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>{isHindi ? 'महत्वपूर्ण देय बिल' : 'Important Bill'}</span>
              </div>
              <p className="font-extrabold text-stone-900 text-base mt-1">
                {importantBills.length > 0
                  ? `${importantBills[0].title} — ₹${importantBills[0].amount || 1842}`
                  : 'Electricity Bill — ₹1,842'}
              </p>
              <span className="text-xs font-bold text-stone-600">
                {isHindi ? 'देय तिथि: कल (24 सितंबर)' : 'Due Tomorrow • Avoid late fees'}
              </span>
            </div>
            <button
              onClick={startBillJourney}
              className="mt-2 text-xs font-black text-amber-900 hover:text-amber-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-amber-300 self-start shadow-2xs"
            >
              <span>{isHindi ? 'बिल विवरण देखें' : 'View Action Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Upcoming Appointment */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-800 uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <span>{isHindi ? 'डॉक्टर अप्वाइंटमेंट' : 'Doctor Appointment'}</span>
              </div>
              <p className="font-extrabold text-stone-900 text-base mt-1">
                {appointments.length > 0
                  ? `${appointments[0].title} — ${appointments[0].time || '11:00 AM'}`
                  : 'Doctor Appointment — 11:00 AM'}
              </p>
              <span className="text-xs font-bold text-stone-600">
                {isHindi ? 'कल सुबह 11:00 बजे' : 'Tomorrow • Clinic Visit'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('reminders')}
              className="mt-2 text-xs font-black text-sky-900 hover:text-sky-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-sky-300 self-start shadow-2xs"
            >
              <span>{isHindi ? 'रिमाइंडर सूची' : 'View Schedule'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Safety Center Attention */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border-2 border-rose-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 uppercase">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{isHindi ? 'डिजिटल सुरक्षा' : 'Digital Safety'}</span>
              </div>
              <p className="font-extrabold text-stone-900 text-base mt-1">
                {highRiskSafetyItems.length > 0
                  ? isHindi
                    ? `${highRiskSafetyItems.length} संदिग्ध संदेश ध्यान देने योग्य`
                    : `${highRiskSafetyItems.length} message needs attention`
                  : isHindi
                  ? 'सभी हालिया संदेश सुरक्षित हैं'
                  : 'Safety center active & monitoring'}
              </p>
              <span className="text-xs font-bold text-stone-600">
                {isHindi ? 'लॉटरी व धोखाधड़ी से बचाव' : 'Protecting against fraud & SMS links'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('safety')}
              className="mt-2 text-xs font-black text-rose-900 hover:text-rose-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-rose-300 self-start shadow-2xs"
            >
              <span>{isHindi ? 'सुरक्षा केंद्र' : 'Open Safety Center'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

        {/* Safety Center */}
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
              {isHindi ? 'सुरक्षा केंद्र' : 'Safety Center'}
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

      {/* Primary Evaluator Demonstration Journeys (Section 13) */}
      <div className="p-6 rounded-3xl bg-stone-900 text-white shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-300 uppercase">
            {isHindi ? 'मुख्य मूल्यांकन डेमो यात्राएँ (1-क्लिक टेस्ट)' : 'Core Evaluator Demo Journeys (1-Click Test)'}
          </h3>
        </div>
        <p className="text-sm font-medium text-stone-300">
          {isHindi
            ? 'निर्देश: नीचे दिए गए किसी भी बटन पर क्लिक करके तीनों मुख्य मूल्यांकन परिदृश्यों का तुरंत परीक्षण करें।'
            : 'Click any scenario below to immediately test the required GenAI Challenge connected workflows.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Journey 1 */}
          <button
            id="journey-btn-scam"
            onClick={startScamJourney}
            className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left border border-stone-700 hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-400">
                Journey 1
              </span>
              <h4 className="font-extrabold text-sm text-white mt-0.5 leading-snug">
                {isHindi ? '🛡️ लॉटरी स्कैम जाँच' : '🛡️ Scam Protection'}
              </h4>
            </div>
            <span className="text-xs text-stone-400 mt-2">
              WhatsApp ₹25 Lakh scam & alert family
            </span>
          </button>

          {/* Journey 2 */}
          <button
            id="journey-btn-bill"
            onClick={startBillJourney}
            className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left border border-stone-700 hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-400">
                Journey 2
              </span>
              <h4 className="font-extrabold text-sm text-white mt-0.5 leading-snug">
                {isHindi ? '📄 बिजली बिल व रिमाइंडर' : '📄 Bill & Reminder'}
              </h4>
            </div>
            <span className="text-xs text-stone-400 mt-2">
              BSES ₹1,842 bill & proactive reminder
            </span>
          </button>

          {/* Journey 3 */}
          <button
            id="journey-btn-appointment"
            onClick={startAppointmentJourney}
            className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left border border-stone-700 hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-400">
                Journey 3
              </span>
              <h4 className="font-extrabold text-sm text-white mt-0.5 leading-snug">
                {isHindi ? '🎙 वॉयस डॉक्टर अप्वाइंटमेंट' : '🎙 Voice Appointment'}
              </h4>
            </div>
            <span className="text-xs text-stone-400 mt-2">
              "Mujhe kal doctor ke paas jaana hai at 11 AM"
            </span>
          </button>
        </div>
      </div>

      {/* TODAY'S SCHEDULED TASKS (Section 6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-stone-900">
              {isHindi ? 'आने वाले कार्य' : 'Upcoming Tasks'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('reminders')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            <span>{isHindi ? 'सभी देखें' : 'View all'} ({reminders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-base font-bold text-stone-800">
              {isHindi ? 'आज के लिए कोई पेंडिंग कार्य नहीं है!' : 'No pending tasks for today!'}
            </p>
            <p className="text-xs font-semibold text-stone-500">
              {isHindi ? 'आप आराम कर सकते हैं।' : 'You are all caught up.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingReminders.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-amber-300 transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReminderStatus(r.id)}
                    className="w-7 h-7 rounded-lg border-2 border-stone-300 hover:border-emerald-600 flex items-center justify-center transition-colors text-transparent hover:text-emerald-600"
                    title="Mark Completed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">
                      {r.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1 font-bold text-stone-700">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {r.date} {r.time ? `• ${r.time}` : ''}
                      </span>
                      {r.amount && (
                        <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          {r.currency || '₹'}{r.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                  {r.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
