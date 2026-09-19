import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { detectIntent } from '../services/apiService';
import {
  startSpeechRecognition,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
} from '../services/speechService';
import { SAMPLE_VOICE_PROMPTS } from '../data/demoData';
import { DetectedIntent } from '../types';

export const TalkToSaathiModal: React.FC = () => {
  const {
    isTalkModalOpen,
    setIsTalkModalOpen,
    talkInitialQuery,
    settings,
    addReminder,
    setActiveTab,
    setExplainPreloadText,
    setSafetyPreloadText,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedResult, setDetectedResult] = useState<DetectedIntent | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isHindi = settings.language === 'hi';

  useEffect(() => {
    if (isTalkModalOpen && talkInitialQuery) {
      setQuery(talkInitialQuery);
      handleProcessQuery(talkInitialQuery);
    }
  }, [isTalkModalOpen, talkInitialQuery]);

  useEffect(() => {
    if (!isTalkModalOpen) {
      if (speechRecognizer) {
        speechRecognizer.stop();
        setSpeechRecognizer(null);
      }
      setIsListening(false);
      stopSpeaking();
      setIsSpeaking(false);
      setDetectedResult(null);
      setQuery('');
    }
  }, [isTalkModalOpen]);

  const handleVoiceToggle = () => {
    if (isListening) {
      speechRecognizer?.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      showToast(
        isHindi
          ? 'माइक्रोफ़ोन समर्थित नहीं है, कृपया लिखकर बताएं।'
          : 'Microphone not supported in this browser. Please type your query.'
      );
      return;
    }

    setIsListening(true);
    const rec = startSpeechRecognition({
      lang: settings.language,
      onResult: (transcript) => {
        setQuery(transcript);
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
    setSpeechRecognizer(rec);
  };

  const handleProcessQuery = async (textToProcess?: string) => {
    const text = (textToProcess || query).trim();
    if (!text) return;

    if (isListening && speechRecognizer) {
      speechRecognizer.stop();
      setIsListening(false);
    }

    setIsLoading(true);
    setDetectedResult(null);

    try {
      const result = await detectIntent({
        query: text,
        language: settings.language,
      });

      setDetectedResult(result);

      // Read aloud the reply if enabled or requested
      if (result.conversationalReply) {
        speakText(result.conversationalReply, isHindi ? 'hi' : 'en');
        setIsSpeaking(true);
      }
    } catch (err) {
      console.error('Intent detection error:', err);
      showToast(
        isHindi
          ? 'क्षमा करें, मैं समझ नहीं पाया। कृपया दोबारा प्रयास करें।'
          : "I couldn't understand this clearly. Please try again in your own words."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAppointment = () => {
    if (!detectedResult?.entities) return;

    const title = detectedResult.entities.title || (isHindi ? 'डॉक्टर का अप्वाइंटमेंट' : 'Doctor Appointment');
    const date = detectedResult.entities.date || '2026-09-19';
    const time = detectedResult.entities.time || '11:00 AM';

    addReminder({
      userId: 'user-sharma',
      title: title,
      description: `Scheduled via SAATHI voice assistant (${time})`,
      date: date.toLowerCase().includes('tomorrow') || date.toLowerCase().includes('kal') ? '2026-09-19' : date,
      time: time,
      category: 'Appointments',
      status: 'PENDING',
      source: 'VOICE_ASSISTANT',
    });

    setIsTalkModalOpen(false);
    setActiveTab('reminders');
  };

  const handleRouteToWorkflow = () => {
    if (!detectedResult) return;

    if (detectedResult.intent === 'EXPLAIN_DOCUMENT') {
      setIsTalkModalOpen(false);
      setActiveTab('explain');
    } else if (detectedResult.intent === 'CHECK_SAFETY') {
      setIsTalkModalOpen(false);
      setActiveTab('safety');
    } else if (detectedResult.intent === 'VIEW_REMINDERS') {
      setIsTalkModalOpen(false);
      setActiveTab('reminders');
    }
  };

  const handleReadAloudToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (detectedResult?.conversationalReply) {
      speakText(detectedResult.conversationalReply, isHindi ? 'hi' : 'en');
      setIsSpeaking(true);
    }
  };

  if (!isTalkModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="talk-modal-content"
        className="bg-stone-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-2 sm:border-2 border-amber-300 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/80 flex items-center justify-center text-amber-100 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isHindi ? 'साथी से बात कीजिए' : 'Talk to SAATHI'}
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                {isHindi
                  ? 'अपनी भाषा में बोलिए या लिखिए'
                  : 'Speak or type naturally in Hindi, English, or Hinglish'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTalkModalOpen(false)}
            className="w-9 h-9 rounded-full bg-amber-700/60 hover:bg-amber-700 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Conversational AI Response Area */}
          {detectedResult && (
            <div
              id="talk-ai-response-card"
              className="p-5 rounded-2xl bg-white border-2 border-amber-200 shadow-sm space-y-4 animate-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    {isHindi ? 'साथी का उत्तर' : 'SAATHI Understood'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReadAloudToggle}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors border border-amber-200"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isHindi ? 'रोकें' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isHindi ? 'सुनिए' : 'Listen'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-lg font-bold text-stone-900 leading-snug">
                "{detectedResult.conversationalReply}"
              </p>

              {/* Connected Workflow: Appointment extraction card (Journey 3) */}
              {(detectedResult.intent === 'CREATE_APPOINTMENT' ||
                detectedResult.intent === 'CREATE_REMINDER') && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 font-extrabold text-base">
                    <Calendar className="w-5 h-5 text-amber-700" />
                    <span>
                      {detectedResult.entities.title || (isHindi ? 'अपॉइंटमेंट' : 'Appointment')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-stone-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span>
                        {detectedResult.entities.date || (isHindi ? 'कल' : 'Tomorrow')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>{detectedResult.entities.time || '11:00 AM'}</span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-stone-800">
                    {isHindi
                      ? 'क्या मैं इसे आपके रिमाइंडर में जोड़ दूँ?'
                      : 'Should I add it to your reminders?'}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      id="talk-confirm-appointment-btn"
                      onClick={handleConfirmAppointment}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-base shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isHindi ? 'हाँ, जोड़ दीजिए' : 'Yes, add it'}</span>
                    </button>
                    <button
                      onClick={() => setDetectedResult(null)}
                      className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm border border-stone-300"
                    >
                      {isHindi ? 'बदलिए' : 'Change'}
                    </button>
                  </div>
                </div>
              )}

              {/* Connected Workflow routing buttons for Explain, Safety, or Reminders */}
              {(detectedResult.intent === 'EXPLAIN_DOCUMENT' ||
                detectedResult.intent === 'CHECK_SAFETY' ||
                detectedResult.intent === 'VIEW_REMINDERS') && (
                <button
                  id="talk-route-workflow-btn"
                  onClick={handleRouteToWorkflow}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-amber-200" />
                  <span>
                    {detectedResult.intent === 'EXPLAIN_DOCUMENT'
                      ? isHindi
                        ? 'दस्तावेज़ विश्लेषण स्क्रीन खोलें'
                        : 'Open Explain Document Screen'
                      : detectedResult.intent === 'CHECK_SAFETY'
                      ? isHindi
                        ? 'सुरक्षा जाँच स्क्रीन खोलें'
                        : 'Open Safety Check Screen'
                      : isHindi
                      ? 'मेरे रिमाइंडर देखें'
                      : 'View My Reminders'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Quick Voice / Text Samples */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isHindi ? 'उदाहरण प्रश्न (क्लिक करें):' : 'Try asking (Click to test):'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  id={`voice-sample-${idx}`}
                  type="button"
                  onClick={() => {
                    const text = isHindi ? sample.hindi : sample.text;
                    setQuery(text);
                    handleProcessQuery(text);
                  }}
                  className="text-left p-3 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-400 shadow-2xs transition-all active:scale-98 flex flex-col justify-between"
                >
                  <span className="text-sm font-bold text-stone-900 leading-snug">
                    "{isHindi ? sample.hindi : sample.text}"
                  </span>
                  <span className="text-xs text-amber-800 font-semibold mt-1">
                    ↳ {sample.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Bar with Huge Voice Mic Button */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-3">
          {/* Big Pulsing Mic Button */}
          <div className="flex items-center justify-center">
            <button
              id="talk-big-mic-button"
              type="button"
              onClick={handleVoiceToggle}
              className={`relative flex items-center justify-center rounded-full transition-all shadow-md active:scale-95 focus:outline-none ${
                isListening
                  ? 'w-20 h-20 bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse'
                  : 'w-16 h-16 bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <p className="text-center text-xs font-bold text-stone-500">
            {isListening
              ? isHindi
                ? 'सुन रहा हूँ... अपनी बात कहिए'
                : 'Listening... please speak clearly'
              : isHindi
              ? 'बोलने के लिए माइक दबाएं या नीचे लिखें'
              : 'Tap mic to speak, or type below'}
          </p>

          {/* Text Input Row */}
          <div className="flex items-center gap-2">
            <input
              id="talk-text-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessQuery();
              }}
              placeholder={
                isHindi
                  ? 'जैसे: मुझे कल डॉक्टर के पास जाना है...'
                  : 'e.g. "Mujhe kal doctor ke paas jaana hai at 11 AM"...'
              }
              className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-base font-medium text-stone-900 bg-white shadow-inner"
            />
            <button
              id="talk-submit-query-btn"
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={() => handleProcessQuery()}
              className="py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-xs"
            >
              {isLoading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
