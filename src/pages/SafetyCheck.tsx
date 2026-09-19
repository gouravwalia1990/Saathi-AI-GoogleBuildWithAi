import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  XCircle,
  Users,
  Volume2,
  VolumeX,
  X,
  Lock,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';
import { analyzeSafety } from '../services/apiService';
import { speakText, stopSpeaking } from '../services/speechService';
import { SAMPLE_SCAMS } from '../data/demoData';
import { SafetyAnalysisResult } from '../types';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingState } from '../components/LoadingState';

export const SafetyCheck: React.FC = () => {
  const {
    settings,
    notifyFamily,
    familyNotifications,
    safetyPreloadText,
    setSafetyPreloadText,
    showToast,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SafetyAnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Notify family confirmation dialog state
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHindi = settings.language === 'hi';

  // Handle preloaded text from Home or Talk modal
  useEffect(() => {
    if (safetyPreloadText) {
      setInputText(safetyPreloadText);
      handleAnalyze(safetyPreloadText);
      setSafetyPreloadText(null);
    }
  }, [safetyPreloadText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImageBase64(base64);
        setImagePreview(base64);
        handleAnalyze(undefined, base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (textToAnalyze?: string, img?: string, mimeType?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    const imgData = img !== undefined ? img : imageBase64;

    if (!text.trim() && !imgData) {
      showToast(
        isHindi
          ? 'कृपया कोई संदेश या स्क्रीनशॉट दर्ज करें।'
          : 'Please enter a message or upload a screenshot to check.'
      );
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await analyzeSafety({
        text,
        imageBase64: imgData || undefined,
        mimeType: mimeType || 'image/jpeg',
        language: settings.language,
      });

      setAnalysisResult(res);

      if (res.summary) {
        speakText(res.summary, isHindi ? 'hi' : 'en');
        setIsSpeaking(true);
      }
    } catch (err) {
      console.error('Error in safety check:', err);
      showToast(
        isHindi
          ? 'सुरक्षा विश्लेषण में त्रुटि आई। पुनः प्रयास करें।'
          : 'Safety check encountered an error. Please retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_SCAMS[0]) => {
    setInputText(sample.content);
    setImageBase64(null);
    setImagePreview(null);
    handleAnalyze(sample.content);
  };

  const handleConfirmNotifyFamily = () => {
    notifyFamily({
      message:
        analysisResult?.summary ||
        'Suspicious message detected claiming unexpected lottery or funds.',
      riskLevel: analysisResult?.riskLevel || 'HIGH',
    });
    setIsNotifyDialogOpen(false);
  };

  const handleReadAloudToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (analysisResult?.summary) {
      const actions = analysisResult.recommendedActions?.join('. ') || '';
      const fullSpeech = `${analysisResult.summary}. ${
        isHindi ? 'सलाह: ' : 'Recommended action: '
      } ${actions}`;
      speakText(fullSpeech, isHindi ? 'hi' : 'en');
      setIsSpeaking(true);
    }
  };

  const clearInputs = () => {
    setInputText('');
    setImageBase64(null);
    setImagePreview(null);
    setAnalysisResult(null);
    stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              {isHindi ? 'सुरक्षा और धोखाधड़ी जाँच' : 'Scam & Safety Check'}
            </h2>
            <p className="text-sm font-semibold text-stone-600">
              {isHindi
                ? 'व्हाट्सएप संदेश, एसएमएस या संदिग्ध लिंक सुरक्षित हैं या नहीं, जाँचिए'
                : 'Check WhatsApp forwards, SMS, unknown links, or payment threats'}
            </p>
          </div>
        </div>

        {(inputText || imageBase64 || analysisResult) && (
          <button
            onClick={clearInputs}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs shadow-2xs transition-colors shrink-0"
          >
            {isHindi ? 'नया संदेश' : 'Reset'}
          </button>
        )}
      </div>

      {/* Senior Safety Rule Reminder (Principle 5) */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-center gap-3 text-amber-950 text-xs sm:text-sm font-bold shadow-2xs">
        <Lock className="w-5 h-5 text-amber-700 shrink-0" />
        <span>
          {isHindi
            ? 'सुरक्षा नियम: साथी या कोई भी बैंक आपसे कभी OTP, पासवर्ड, एटीएम पिन या सीवीवी (CVV) नहीं माँगता।'
            : 'Golden Safety Rule: SAATHI, banks, and official departments will NEVER ask for your OTP, PIN, password, or CVV.'}
        </span>
      </div>

      {/* Quick Test Scams (GenAI Challenge Journey 1) */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {isHindi ? 'परीक्षण संदेश (क्लिक करके जांचें):' : 'Test scam examples (Click to test):'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_SCAMS.map((scam) => (
            <button
              key={scam.id}
              id={`sample-scam-${scam.id}`}
              onClick={() => handleSelectSample(scam)}
              className="p-3.5 rounded-2xl bg-white hover:bg-rose-50/80 border-2 border-stone-200 hover:border-rose-400 text-left transition-all active:scale-98 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span
                  className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                    scam.category.includes('Scam')
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {scam.category}
                </span>
                <h4 className="font-extrabold text-stone-900 text-sm mt-1.5 leading-snug">
                  {isHindi ? scam.hindiTitle : scam.title}
                </h4>
              </div>
              <span className="text-xs font-semibold text-stone-500 mt-2 line-clamp-1">
                {scam.snippet}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="safety-upload-screenshot-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 text-stone-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Upload className="w-5 h-5 text-stone-600" />
            <span>{isHindi ? 'स्क्रीनशॉट डालें' : 'Upload Screenshot'}</span>
          </button>

          <button
            id="safety-camera-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Camera className="w-5 h-5 text-rose-700" />
            <span>{isHindi ? 'कैमरा फोटो' : 'Take Photo'}</span>
          </button>
        </div>

        {/* Screenshot preview */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-rose-300 max-h-60 bg-stone-100 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Uploaded message screenshot"
              className="max-h-60 object-contain"
            />
            <button
              onClick={() => {
                setImageBase64(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-stone-900/70 text-white flex items-center justify-center hover:bg-stone-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Input Area */}
        <div>
          <label
            htmlFor="safety-text-input"
            className="block text-sm font-bold text-stone-700 mb-1.5"
          >
            {isHindi
              ? 'या संदेश/लिंक यहाँ पेस्ट करें:'
              : 'Or paste WhatsApp / SMS message or link here:'}
          </label>
          <textarea
            id="safety-text-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isHindi
                ? 'जैसे: "बधाई हो! आपने 25 लाख जीते हैं... या बिजली कटने का संदेश"...'
                : 'e.g. "Congratulations! You won ₹25,00,000. Click link to claim..."'
            }
            className="w-full p-4 rounded-2xl border-2 border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 text-base font-medium text-stone-900 bg-stone-50/50 shadow-inner"
          />
        </div>

        {/* Submit Check Button */}
        <button
          id="safety-check-submit-btn"
          type="button"
          disabled={isLoading || (!inputText.trim() && !imageBase64)}
          onClick={() => handleAnalyze()}
          className="w-full py-4 px-6 rounded-2xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-extrabold text-lg shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 focus:ring-4 focus:ring-rose-300"
        >
          {isLoading ? (
            <Sparkles className="w-6 h-6 animate-spin" />
          ) : (
            <ShieldAlert className="w-6 h-6" />
          )}
          <span>
            {isLoading
              ? isHindi
                ? 'जाँच जारी है...'
                : 'Analyzing Risk...'
              : isHindi
              ? 'जाँचिए: क्या यह संदेश सुरक्षित है?'
              : 'Check: Is This Message Safe?'}
          </span>
        </button>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <LoadingState
          message={isHindi ? 'साथी इस संदेश की सुरक्षा जाँच कर रहा है...' : 'SAATHI is checking potential scam indicators...'}
          subMessage={isHindi ? 'संदिग्ध लिंक और बैंक विवरण अनुरोध का विश्लेषण हो रहा है' : 'Evaluating unverified links, urgency, and financial requests'}
        />
      )}

      {/* Structured Result Display (Section 8 & 13) */}
      {analysisResult && (
        <div
          id="safety-result-card"
          className={`p-6 sm:p-7 rounded-3xl bg-white border-3 shadow-xl space-y-6 animate-in slide-in-from-bottom-3 duration-300 ${
            analysisResult.riskLevel === 'HIGH'
              ? 'border-rose-500 ring-4 ring-rose-100'
              : analysisResult.riskLevel === 'MEDIUM'
              ? 'border-amber-500 ring-4 ring-amber-100'
              : 'border-emerald-500 ring-4 ring-emerald-100'
          }`}
        >
          {/* Risk Level Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  analysisResult.riskLevel === 'HIGH'
                    ? 'bg-rose-600 text-white'
                    : analysisResult.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {analysisResult.riskLevel === 'HIGH' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : analysisResult.riskLevel === 'MEDIUM' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {isHindi ? 'सुरक्षा मूल्यांकन' : 'Risk Assessment'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {analysisResult.riskLevel === 'HIGH'
                    ? isHindi
                      ? '⚠️ संभावित धोखाधड़ी (हाई रिस्क)'
                      : '⚠️ Possible Scam (HIGH Risk)'
                    : analysisResult.riskLevel === 'MEDIUM'
                    ? isHindi
                      ? '⚠️ मध्यम जोखिम (सावधानी बरतें)'
                      : '⚠️ Potential Risk (MEDIUM Risk)'
                    : isHindi
                    ? ' सुरक्षित संदेश (LOW Risk)'
                    : ' Appears Safe (LOW Risk)'}
                </h3>
              </div>
            </div>

            <button
              onClick={handleReadAloudToggle}
              className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm border border-amber-300 transition-colors shadow-2xs"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" />
                  <span>{isHindi ? 'आवाज़ रोकें' : 'Stop'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-700" />
                  <span>{isHindi ? 'सुनिए' : 'Listen Aloud'}</span>
                </>
              )}
            </button>
          </div>

          {/* Simple Explanation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs font-bold uppercase text-stone-600 tracking-wider">
              {isHindi ? 'सरल व्याख्या' : 'Explanation'}
            </span>
            <p className="text-lg font-bold text-stone-900 mt-1 leading-relaxed">
              "{analysisResult.summary}"
            </p>
          </div>

          {/* Why this looks suspicious (Indicators) */}
          {analysisResult.indicators && analysisResult.indicators.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  {isHindi
                    ? 'यह संदेश क्यों संदिग्ध लगता है:'
                    : 'Why this looks suspicious:'}
                </span>
              </h4>
              <ul className="space-y-2">
                {analysisResult.indicators.map((ind, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-base font-semibold text-stone-800"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What you should do (Recommended Actions) */}
          {analysisResult.recommendedActions &&
            analysisResult.recommendedActions.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 space-y-3">
                <h4 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>
                    {isHindi ? 'आपको क्या करना चाहिए:' : 'What you should do:'}
                  </span>
                </h4>
                <ol className="space-y-2 pl-1">
                  {analysisResult.recommendedActions.map((action, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-base font-bold text-emerald-900"
                    >
                      <span className="font-black">{idx + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          {/* Things to Avoid */}
          {analysisResult.thingsToAvoid &&
            analysisResult.thingsToAvoid.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <h4 className="text-sm font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>
                    {isHindi ? 'इन चीज़ों से बिल्कुल बचें:' : 'Things to strictly avoid:'}
                  </span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {analysisResult.thingsToAvoid.map((avoid, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm font-bold text-rose-950"
                    >
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{avoid}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Connected Workflow: Notify Family Button (Journey 1, Section 8 & 16) */}
          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-800" />
                <h4 className="text-base font-extrabold text-stone-900">
                  {isHindi ? 'परिवार के सदस्य को सतर्क करें' : 'Family Member Alert'}
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {settings.trustedContactName} ({settings.trustedContactRelation})
              </span>
            </div>

            <p className="text-sm font-semibold text-stone-700">
              {isHindi
                ? `क्या आप अपने विश्वस्त पारिवारिक संपर्क (${settings.trustedContactName}) को इस संदिग्ध संदेश के बारे में बताना चाहते हैं?`
                : `Would you like to notify your trusted family member (${settings.trustedContactName}) about this safety concern?`}
            </p>

            <div className="pt-1">
              <button
                id="safety-notify-family-btn"
                type="button"
                onClick={() => setIsNotifyDialogOpen(true)}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-98 text-white font-extrabold text-base shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Users className="w-5 h-5" />
                <span>{isHindi ? '🛡️ परिवार को सूचित करें' : '🛡️ Notify Family'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Family Notification History if any sent */}
      {familyNotifications.length > 0 && (
        <div className="p-5 rounded-3xl bg-white border-2 border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-900 font-extrabold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              {isHindi ? 'हाल ही में भेजे गए पारिवारिक अलर्ट' : 'Simulated Family Alerts Sent'}
            </span>
          </div>
          <div className="space-y-2">
            {familyNotifications.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div>
                  <span className="font-bold">{ev.contactName}: </span>
                  <span>"{ev.message}"</span>
                </div>
                <span className="text-stone-500 font-bold text-xs shrink-0">
                  {ev.timestamp} • Simulated
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog before notifying family (Principle 4) */}
      <ConfirmationDialog
        isOpen={isNotifyDialogOpen}
        title={isHindi ? 'पारिवारिक सूचना पुष्टि' : 'Confirm Family Notification'}
        message={
          isHindi
            ? `क्या आप अपने विश्वसनीय पारिवारिक सदस्य (${settings.trustedContactName} - ${settings.trustedContactPhone}) को इस सुरक्षा चिंता के बारे में सूचित करना चाहते हैं?`
            : `Would you like to notify your trusted family member (${settings.trustedContactName} at ${settings.trustedContactPhone}) about this safety concern?`
        }
        subMessage={
          isHindi
            ? 'डेमो मोड: यह आपके परिवार के सदस्य के लिए एक सिम्युलेटेड अलर्ट तैयार करेगा।'
            : 'Demo Mode: This will dispatch a simulated safety alert to your family member.'
        }
        confirmLabel={isHindi ? 'हाँ, सूचित करें' : 'Yes, Notify Family'}
        cancelLabel={isHindi ? 'रद्द करें' : 'Cancel'}
        onConfirm={handleConfirmNotifyFamily}
        onCancel={() => setIsNotifyDialogOpen(false)}
      />
    </div>
  );
};
