import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  ExternalLink,
  Loader2,
  Edit3,
} from 'lucide-react';
import { detectIntent } from '../services/apiService';
import {
  startSpeechRecognition,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
  VoiceListeningState,
  SpeechRecognizerHandle,
} from '../services/speechService';
import { SAMPLE_VOICE_PROMPTS } from '../data/demoData';
import { DetectedIntent } from '../types';

interface ConversationMessage {
  id: string;
  sender: 'user' | 'saathi';
  text: string;
  result?: DetectedIntent;
  status?: 'pending' | 'confirmed' | 'cancelled';
  error?: boolean;
  canRetry?: boolean;
}

export const TalkToSaathiModal: React.FC = () => {
  const {
    isTalkModalOpen,
    setIsTalkModalOpen,
    talkInitialQuery,
    settings,
    userProfile,
    addReminder,
    setActiveTab,
    setExplainPreloadText,
    setSafetyPreloadText,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceListeningState>('IDLE');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechRecognizer, setSpeechRecognizer] = useState<SpeechRecognizerHandle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHindi = settings.language === 'hi';

  const defaultGreeting = isHindi
    ? 'मैं आपकी क्या मदद कर सकता हूँ? आप कोई दस्तावेज़ समझना चाहें, कोई संदेश जाँचना चाहें, या किसी डॉक्टर अप्वाइंटमेंट या बिल का रिमाइंडर तय करना चाहें, मुझे बताइए।'
    : 'I am here to help. Would you like me to explain a document, check if a message is safe, or help you with a reminder?';

  // Scroll to bottom whenever messages or loading changes
  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isListening, interimTranscript]);

  useEffect(() => {
    if (isTalkModalOpen && talkInitialQuery) {
      setQuery(talkInitialQuery);
      handleProcessQuery(talkInitialQuery);
    }
  }, [isTalkModalOpen, talkInitialQuery]);

  useEffect(() => {
    if (!isTalkModalOpen) {
      if (speechRecognizer) {
        speechRecognizer.abort();
        setSpeechRecognizer(null);
      }
      setIsListening(false);
      setVoiceStatus('IDLE');
      setVoiceError(null);
      setFinalTranscript('');
      setInterimTranscript('');
      stopSpeaking();
      setIsSpeaking(false);
      setQuery('');
      setMessages([]);
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isTalkModalOpen]);

  const handleVoiceToggle = () => {
    if (isListening) {
      // User explicitly stopped listening (Requirement 7)
      if (speechRecognizer) {
        speechRecognizer.stop();
      }
      setIsListening(false);
      setVoiceStatus('STOPPED');
      setInterimTranscript('');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError(
        isHindi
          ? 'इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है। कृपया नीचे लिखकर बताएं।'
          : "Voice input isn't available in this browser. You can type your request below."
      );
      showToast(
        isHindi
          ? 'माइक्रोफ़ोन समर्थित नहीं है, कृपया लिखकर बताएं।'
          : 'Microphone not supported in this browser. Please type your query.'
      );
      return;
    }

    // Start continuous listening session with natural pause grace period (Requirement 3 & 4)
    setVoiceError(null);
    setIsListening(true);
    setVoiceStatus('LISTENING');
    setInterimTranscript('');

    const rec = startSpeechRecognition({
      lang: settings.language,
      silenceGracePeriodMs: 6000, // 6.0s silence grace period allowing natural pauses for seniors
      maxListeningDurationMs: 60000,
      onStatusChange: (status) => {
        setVoiceStatus(status);
      },
      onInterim: (interim, currentFinal) => {
        setInterimTranscript(interim);
        setFinalTranscript(currentFinal);
        const combined = currentFinal
          ? interim
            ? `${currentFinal} ${interim}`
            : currentFinal
          : interim;
        setQuery(combined.trim());
      },
      onFinalSegment: (currentFinal) => {
        setFinalTranscript(currentFinal);
        setQuery(currentFinal.trim());
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setVoiceError(
          isHindi
            ? 'साथी ठीक से सुन नहीं पाया। कृपया दोबारा बोलें।'
            : "SAATHI couldn't hear that clearly. Please try again."
        );
        setIsListening(false);
        setVoiceStatus('ERROR');
      },
      onEnd: (completeFinal, reason) => {
        setIsListening(false);
        setSpeechRecognizer(null);
        setInterimTranscript('');

        if (completeFinal.trim()) {
          setFinalTranscript(completeFinal.trim());
          setQuery(completeFinal.trim());
          setVoiceStatus('STOPPED');
        } else {
          setVoiceStatus('IDLE');
        }
      },
    });

    setSpeechRecognizer(rec);
  };

  const handleProcessQuery = async (textToProcess?: string) => {
    const rawText = (textToProcess || query).trim();
    if (!rawText || isLoading) return;

    // Cleanly stop microphone if still listening
    if (isListening && speechRecognizer) {
      speechRecognizer.stop();
      setIsListening(false);
    }

    setVoiceStatus('PROCESSING');
    const currentInputText = rawText;
    setLastQuery(currentInputText);
    setQuery('');
    setFinalTranscript('');
    setInterimTranscript('');

    // Add user message to conversation
    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ConversationMessage = {
      id: userMsgId,
      sender: 'user',
      text: currentInputText,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    setIsLoading(true);

    try {
      const result = await detectIntent({
        query: currentInputText,
        language: settings.language,
      });

      const saathiMsgId = 'saathi-' + Date.now();
      const replyText =
        result.conversationalReply ||
        (isHindi ? 'मैंने समझ लिया।' : 'I understood your request.');

      const newSaathiMsg: ConversationMessage = {
        id: saathiMsgId,
        sender: 'saathi',
        text: replyText,
        result: result,
        status: 'pending',
      };

      setMessages((prev) => [...prev, newSaathiMsg]);
      setVoiceStatus('IDLE');

      // Read aloud if desired
      if (replyText) {
        speakText(replyText, isHindi ? 'hi' : 'en');
        setIsSpeaking(true);
      }
    } catch (err) {
      console.error('Intent detection error:', err);
      const errorMsgId = 'saathi-err-' + Date.now();
      const newErrorMsg: ConversationMessage = {
        id: errorMsgId,
        sender: 'saathi',
        text: isHindi
          ? 'मैं इसे अभी समझ नहीं पाया। कृपया दोबारा प्रयास करें।'
          : "I couldn't understand that right now. Please try again.",
        error: true,
        canRetry: true,
      };
      setMessages((prev) => [...prev, newErrorMsg]);
      setVoiceStatus('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleProcessQuery(lastQuery);
    }
  };

  const handleConfirmAction = (msgId: string, result?: DetectedIntent) => {
    if (!result) return;

    const title =
      result.title ||
      result.entities?.title ||
      (result.intent === 'CREATE_APPOINTMENT'
        ? isHindi
          ? 'डॉक्टर का अप्वाइंटमेंट'
          : 'Doctor appointment'
        : isHindi
        ? 'बिजली बिल भुगतान'
        : 'Electricity bill reminder');

    const rawDate = result.date || result.entities?.date || '2026-09-20';
    let formattedDate = rawDate;
    if (rawDate.toLowerCase().includes('tomorrow') || rawDate.toLowerCase().includes('kal')) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      formattedDate = tom.toISOString().split('T')[0];
    }

    const time = result.time || result.entities?.time || '11:00 AM';

    addReminder({
      userId: userProfile.userId,
      title: title,
      description: `Scheduled via SAATHI assistant (${time})`,
      date: formattedDate,
      time: time,
      category: result.intent === 'CREATE_APPOINTMENT' ? 'Appointments' : 'Bills',
      status: 'PENDING',
      source: 'VOICE_ASSISTANT',
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, status: 'confirmed' } : msg
      )
    );

    showToast(
      isHindi
        ? 'रिमाइंडर सफलतापूर्वक सुरक्षित कर लिया गया है!'
        : 'Reminder saved successfully!'
    );
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, status: 'cancelled' } : msg
      )
    );
  };

  const handleChangeAction = (result?: DetectedIntent) => {
    const existingTitle = result?.title || result?.entities?.title || '';
    setQuery(existingTitle);
    inputRef.current?.focus();
  };

  const handleRouteToWorkflow = (intent: string) => {
    setIsTalkModalOpen(false);
    if (intent === 'EXPLAIN_DOCUMENT') {
      if (lastQuery) setExplainPreloadText(lastQuery);
      setActiveTab('explain');
    } else if (intent === 'CHECK_SAFETY') {
      if (lastQuery) setSafetyPreloadText(lastQuery);
      setActiveTab('safety');
    } else if (
      intent === 'VIEW_REMINDERS' ||
      intent === 'CREATE_APPOINTMENT' ||
      intent === 'CREATE_REMINDER'
    ) {
      setActiveTab('reminders');
    }
  };

  const handleReadAloudToggle = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(text, isHindi ? 'hi' : 'en');
      setIsSpeaking(true);
    }
  };

  if (!isTalkModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="talk-modal-title"
      data-testid="talk-to-saathi-dialog"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="talk-modal-content"
        className="bg-stone-50 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-2 sm:border-2 border-amber-300 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/80 flex items-center justify-center text-amber-100 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
            </div>
            <div>
              <h2 id="talk-modal-title" className="text-xl font-bold tracking-tight">
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

        {/* Modal Body / Conversation Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Welcome greeting card if conversation has not started */}
          {messages.length === 0 && (
            <div
              id="talk-initial-greeting-card"
              className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {isHindi ? 'नमस्ते' : 'Welcome'}
                </span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-stone-800 leading-relaxed">
                "{defaultGreeting}"
              </p>

              {/* Sample Quick Prompt Chips */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
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
                        const promptText = isHindi ? sample.hindi : sample.text;
                        setQuery(promptText);
                        handleProcessQuery(promptText);
                      }}
                      className="text-left p-3 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-400 shadow-2xs transition-all active:scale-98 flex flex-col justify-between"
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
          )}

          {/* Active Voice Listening / Transcription Card (Requirements 5 & 14) */}
          {(isListening || voiceStatus === 'TRANSCRIBING') && (
            <div
              data-testid="listening-indicator"
              className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-sm space-y-2.5 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <span
                    data-testid="voice-status-text"
                    className="text-sm font-bold text-stone-900 flex items-center gap-1.5"
                  >
                    {voiceStatus === 'TRANSCRIBING'
                      ? isHindi
                        ? 'साथी आपकी आवाज़ सुन रहा है...'
                        : 'SAATHI is hearing you...'
                      : isHindi
                      ? '🔴 सुन रहा हूँ... अपनी बात कहिए'
                      : '🔴 Listening...'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                  {isHindi ? 'विराम ले सकते हैं' : 'Natural pauses allowed'}
                </span>
              </div>

              {/* Distinguish Final vs Interim Text (Requirement 5) */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-base leading-relaxed min-h-[54px] shadow-2xs">
                {finalTranscript && (
                  <span data-testid="final-transcript" className="font-extrabold text-stone-900">
                    {finalTranscript}{' '}
                  </span>
                )}
                {interimTranscript && (
                  <span
                    data-testid="interim-transcript"
                    className="font-bold text-amber-700 italic"
                  >
                    {interimTranscript}...
                  </span>
                )}
                {!finalTranscript && !interimTranscript && (
                  <span className="text-stone-400 italic text-sm">
                    {isHindi
                      ? 'आप जो बोलेंगे यहाँ दिखाई देगा...'
                      : 'Speak now — your words will appear here...'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stopped Voice State (Requirement 7) */}
          {voiceStatus === 'STOPPED' && !isLoading && (
            <div
              data-testid="voice-stopped-banner"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs font-semibold text-emerald-900 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span data-testid="voice-status-text">
                  {isHindi
                    ? 'बात पूरी हो गई। नीचे लिखे संदेश की जाँच करें और तीर का बटन दबाएं।'
                    : 'Transcript ready. Review below and tap Send.'}
                </span>
              </div>
            </div>
          )}

          {/* Voice Error State (Requirement 13) */}
          {voiceError && (
            <div
              data-testid="voice-error-banner"
              className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between text-sm font-semibold text-rose-900 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span data-testid="voice-status-text">{voiceError}</span>
              </div>
              <button
                type="button"
                onClick={handleVoiceToggle}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0"
              >
                {isHindi ? 'दोबारा बोलें' : 'Try Again'}
              </button>
            </div>
          )}

          {/* Unsupported Browser Warning (Requirement 13) */}
          {!isSpeechRecognitionSupported() && (
            <div
              data-testid="voice-unsupported-banner"
              className="p-3 rounded-xl bg-stone-100 border border-stone-300 text-xs font-medium text-stone-700 text-center"
            >
              {isHindi
                ? 'इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है। आप नीचे लिखकर पूछ सकते हैं।'
                : "Voice input isn't available in this browser. You can type your request below."}
            </div>
          )}

          {/* Conversation History Stream */}
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div
                  key={msg.id}
                  className="flex justify-end animate-in slide-in-from-bottom-1 duration-200"
                >
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-xs bg-stone-900 text-white shadow-sm">
                    <p className="text-base font-semibold leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            }

            // SAATHI Response Bubble
            return (
              <div
                key={msg.id}
                data-testid="saathi-response"
                className="flex flex-col gap-2 max-w-[95%] animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="p-5 rounded-2xl rounded-tl-xs bg-white border-2 border-amber-200 shadow-sm space-y-3">
                  {/* Top Bar with Intent Tag & Listen Button */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div
                      data-testid="intent-result"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        {msg.result?.intent === 'CREATE_APPOINTMENT'
                          ? isHindi
                            ? 'डॉक्टर अप्वाइंटमेंट'
                            : 'Appointment Intent'
                          : msg.result?.intent === 'CREATE_REMINDER'
                          ? isHindi
                            ? 'रिमाइंडर'
                            : 'Reminder Intent'
                          : msg.result?.intent === 'CHECK_SAFETY'
                          ? isHindi
                            ? 'सुरक्षा जाँच'
                            : 'Safety Check Intent'
                          : msg.result?.intent === 'EXPLAIN_DOCUMENT'
                          ? isHindi
                            ? 'दस्तावेज़ स्पष्टीकरण'
                            : 'Document Explanation'
                          : isHindi
                          ? 'सामान्य सहायता'
                          : 'General Help'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReadAloudToggle(msg.text)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                      title="Listen to response"
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

                  {/* Conversational Text */}
                  <p className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                    "{msg.text}"
                  </p>

                  {/* Error & Retry State */}
                  {msg.error && msg.canRetry && (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isHindi ? 'दोबारा प्रयास करें' : 'Retry'}</span>
                      </button>
                    </div>
                  )}

                  {/* Confirmation Card for Appointments or Reminders */}
                  {msg.result &&
                    (msg.result.intent === 'CREATE_APPOINTMENT' ||
                      msg.result.intent === 'CREATE_REMINDER') && (
                      <div
                        data-testid="confirmation-dialog"
                        className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 space-y-3 mt-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-stone-900 font-extrabold text-base">
                            <Calendar className="w-5 h-5 text-amber-700" />
                            <span>
                              {msg.result.title ||
                                msg.result.entities?.title ||
                                (msg.result.intent === 'CREATE_APPOINTMENT'
                                  ? isHindi
                                    ? 'डॉक्टर का अप्वाइंटमेंट'
                                    : 'Doctor appointment'
                                  : 'Reminder')}
                            </span>
                          </div>
                          {msg.result.confidence && (
                            <span className="text-xs font-bold text-stone-500">
                              {Math.round(msg.result.confidence * 100)}% match
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-stone-700">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <span>
                              {msg.result.date ||
                                msg.result.entities?.date ||
                                (isHindi ? 'कल' : 'Tomorrow')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-stone-400" />
                            <span>
                              {msg.result.time ||
                                msg.result.entities?.time ||
                                '11:00 AM'}
                            </span>
                          </div>
                        </div>

                        {/* Confirmation State Controls */}
                        {msg.status === 'confirmed' ? (
                          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                              <span>
                                {isHindi
                                  ? '✓ सफलतापूर्वक सुरक्षित कर लिया गया'
                                  : '✓ Saved successfully'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsTalkModalOpen(false);
                                setActiveTab('reminders');
                              }}
                              className="text-xs font-extrabold text-emerald-800 underline hover:text-emerald-900 flex items-center gap-1"
                            >
                              <span>{isHindi ? 'देखें' : 'View'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ) : msg.status === 'cancelled' ? (
                          <div className="p-3 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 font-semibold text-sm">
                            {isHindi ? 'रद्द कर दिया गया।' : 'Cancelled.'}
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-sm font-bold text-stone-800">
                              {isHindi
                                ? 'क्या मैं इसे आपके रिमाइंडर में जोड़ दूँ?'
                                : 'Would you like me to save this?'}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                data-testid="confirm-action"
                                onClick={() => handleConfirmAction(msg.id, msg.result)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-98"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isHindi ? 'हाँ, जोड़ें' : 'Confirm'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleChangeAction(msg.result)}
                                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm border border-stone-300 flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isHindi ? 'बदलिए' : 'Change'}</span>
                              </button>
                              <button
                                type="button"
                                data-testid="cancel-action"
                                onClick={() => handleCancelAction(msg.id)}
                                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-bold text-sm border border-stone-300 transition-colors"
                              >
                                <span>{isHindi ? 'रद्द करें' : 'Cancel'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Connected Workflow shortcuts for Explain, Safety, Reminders */}
                  {msg.result &&
                    (msg.result.intent === 'EXPLAIN_DOCUMENT' ||
                      msg.result.intent === 'CHECK_SAFETY' ||
                      msg.result.intent === 'VIEW_REMINDERS') && (
                      <button
                        type="button"
                        onClick={() => handleRouteToWorkflow(msg.result!.intent)}
                        className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all mt-2"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-200" />
                        <span>
                          {msg.result.intent === 'EXPLAIN_DOCUMENT'
                            ? isHindi
                              ? 'दस्तावेज़ समझें स्क्रीन खोलें'
                              : 'Open Explain Document Screen'
                            : msg.result.intent === 'CHECK_SAFETY'
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
              </div>
            );
          })}

          {/* Thinking / Processing indicator */}
          {isLoading && (
            <div
              data-testid="saathi-thinking"
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-amber-200 shadow-xs text-amber-900 animate-in fade-in duration-150"
            >
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-extrabold text-stone-900">
                  {isHindi ? 'साथी सोच रहा है…' : 'SAATHI is thinking…'}
                </p>
                <p className="text-xs text-stone-500">
                  {isHindi
                    ? 'आपकी बात को समझा जा रहा है'
                    : 'Analyzing your query and finding the best action'}
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Senior-Friendly Voice Mic and Input Area (Requirements 7, 14, 15) */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-3.5 shrink-0">
          {/* Prominent Senior-Friendly Mic Toggle Control */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <button
              id="talk-big-mic-button"
              data-testid="talk-big-mic-button"
              type="button"
              onClick={handleVoiceToggle}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`relative px-6 py-3 rounded-2xl flex items-center gap-3 transition-all shadow-md active:scale-95 focus:outline-none focus:ring-4 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-200 focus:ring-rose-300 animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-300'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 shrink-0" />
                  <span className="font-extrabold text-base tracking-wide">
                    {isHindi ? 'सुनना बंद करें' : 'Stop Listening'}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 shrink-0" />
                  <span className="font-extrabold text-base tracking-wide">
                    {isHindi ? 'बोलना शुरू करें' : 'Start Speaking'}
                  </span>
                </>
              )}
            </button>

            <p
              data-testid="mic-helper-text"
              className="text-center text-xs font-bold text-stone-500"
            >
              {isListening
                ? isHindi
                  ? 'सुन रहा हूँ... आप बीच में रुक कर भी बोल सकते हैं'
                  : 'Listening... natural pauses allowed'
                : isHindi
                ? 'बोलने के लिए बटन दबाएं या नीचे लिखें'
                : 'Tap to speak, or type below'}
            </p>
          </div>

          {/* Text Input Row — Always available for review and sending (Requirement 11) */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id="talk-text-input"
              data-testid="talk-input"
              type="text"
              value={query}
              disabled={isLoading}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && query.trim()) {
                  handleProcessQuery();
                }
              }}
              placeholder={
                isHindi
                  ? 'जैसे: मुझे कल डॉक्टर के पास जाना है at 11 AM...'
                  : 'e.g. "Mujhe kal doctor ke paas jaana hai at 11 AM"...'
              }
              className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-base font-medium text-stone-900 bg-white shadow-inner disabled:bg-stone-100 disabled:text-stone-400"
            />
            <button
              id="talk-submit-query-btn"
              data-testid="talk-send"
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={() => handleProcessQuery()}
              className="py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-xs"
              aria-label="Send query"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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
