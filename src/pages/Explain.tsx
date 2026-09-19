import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Upload,
  Camera,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { analyzeDocument } from '../services/apiService';
import { speakText, stopSpeaking } from '../services/speechService';
import { SAMPLE_DOCUMENTS } from '../data/demoData';
import { DocumentAnalysisResult } from '../types';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingState } from '../components/LoadingState';

export const Explain: React.FC = () => {
  const {
    settings,
    addReminder,
    setActiveTab,
    explainPreloadText,
    setExplainPreloadText,
    showToast,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reminder confirmation modal state
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHindi = settings.language === 'hi';

  // Handle preloaded text from Home page
  useEffect(() => {
    if (explainPreloadText) {
      if (explainPreloadText.startsWith('data:image/')) {
        setImageBase64(explainPreloadText);
        setImagePreview(explainPreloadText);
        handleAnalyze({ image: explainPreloadText });
      } else {
        setInputText(explainPreloadText);
        handleAnalyze({ text: explainPreloadText });
      }
      setExplainPreloadText(null);
    }
  }, [explainPreloadText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImageBase64(base64);
        setImagePreview(base64);
        handleAnalyze({ image: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (override?: { text?: string; image?: string; mimeType?: string }) => {
    const textToAnalyze = override?.text !== undefined ? override.text : inputText;
    const imgToAnalyze = override?.image !== undefined ? override.image : imageBase64;

    if (!textToAnalyze.trim() && !imgToAnalyze) {
      showToast(
        isHindi
          ? 'कृपया कोई बिल, पत्र या संदेश दर्ज करें।'
          : 'Please upload an image or enter text to explain.'
      );
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await analyzeDocument({
        text: textToAnalyze,
        imageBase64: imgToAnalyze || undefined,
        mimeType: override?.mimeType || 'image/jpeg',
        language: settings.language,
      });

      setAnalysisResult(res);

      if (res.simpleSummary) {
        speakText(res.simpleSummary, isHindi ? 'hi' : 'en');
        setIsSpeaking(true);
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
      showToast(
        isHindi
          ? 'विश्लेषण में समस्या आई। पुनः प्रयास करें।'
          : 'Could not analyze document. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setInputText(sample.content);
    setImageBase64(null);
    setImagePreview(null);
    handleAnalyze({ text: sample.content });
  };

  const handleCreateSuggestedReminder = () => {
    if (!analysisResult?.suggestedReminder) return;

    const suggested = analysisResult.suggestedReminder;
    const remTitle = suggested.title || analysisResult.documentType || 'Bill Payment';
    const remDate = suggested.date || analysisResult.dueDate || '2026-09-24';
    const remTime = suggested.time || '09:00 AM';

    addReminder({
      userId: 'user-sharma',
      title: remTitle,
      description: analysisResult.simpleSummary || 'Document follow-up reminder',
      date: remDate,
      time: remTime,
      amount: analysisResult.amount,
      currency: analysisResult.currency,
      category: 'Bills',
      status: 'PENDING',
      source: 'DOCUMENT_ANALYSIS',
    });

    setIsReminderDialogOpen(false);
    showToast(
      isHindi
        ? `रिमाइंडर तैयार: ${remTitle}`
        : `Reminder scheduled for ${remDate} at ${remTime}`
    );
  };

  const handleReadAloudToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (analysisResult?.simpleSummary) {
      const fullSpeech = `${analysisResult.simpleSummary} ${
        analysisResult.requiredAction ? `आवश्यक कदम: ${analysisResult.requiredAction}` : ''
      }`;
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
      <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              {isHindi ? 'कागज़ या बिल समझिए' : 'Explain Anything'}
            </h2>
            <p className="text-sm font-semibold text-stone-600">
              {isHindi
                ? 'बिजली का बिल, डॉक्टर की पर्ची या सरकारी नोटिस यहाँ डालें'
                : 'Upload or paste any bill, notice, prescription, or letter'}
            </p>
          </div>
        </div>

        {(inputText || imageBase64 || analysisResult) && (
          <button
            onClick={clearInputs}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs shadow-2xs transition-colors shrink-0"
          >
            {isHindi ? 'नया कागज़' : 'Start Fresh'}
          </button>
        )}
      </div>

      {/* Sample Bills / Documents quick clickers */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {isHindi ? 'नमूना दस्तावेज़ (क्लिक करके देखें):' : 'Sample documents (Click to load):'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              id={`sample-doc-${doc.id}`}
              onClick={() => handleSelectSample(doc)}
              className="p-3.5 rounded-2xl bg-white hover:bg-sky-50/80 border-2 border-stone-200 hover:border-sky-400 text-left transition-all active:scale-98 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold uppercase text-sky-800">
                  {doc.category}
                </span>
                <h4 className="font-extrabold text-stone-900 text-sm mt-0.5 leading-snug">
                  {isHindi ? doc.hindiTitle : doc.title}
                </h4>
              </div>
              <span className="text-xs font-semibold text-stone-500 mt-2">
                {doc.snippet}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload & Input Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="explain-upload-picture-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 text-stone-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Upload className="w-5 h-5 text-stone-600" />
            <span>{isHindi ? 'फोटो अपलोड करें' : 'Upload Image'}</span>
          </button>

          <button
            id="explain-take-photo-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3.5 px-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-300 text-sky-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Camera className="w-5 h-5 text-sky-700" />
            <span>{isHindi ? 'कैमरा फोटो लें' : 'Take Photo'}</span>
          </button>
        </div>

        {/* Image Preview if uploaded */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300 max-h-60 bg-stone-100 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Uploaded document preview"
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
            htmlFor="explain-text-input"
            className="block text-sm font-bold text-stone-700 mb-1.5"
          >
            {isHindi
              ? 'या दस्तावेज़ का संदेश / टेक्स्ट यहाँ लिखें या पेस्ट करें:'
              : 'Or paste / type document text here:'}
          </label>
          <textarea
            id="explain-text-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isHindi
                ? 'यहाँ बिल या नोटिस का संदेश लिखें...'
                : 'Paste bill details, official SMS, or medical note here...'
            }
            className="w-full p-4 rounded-2xl border-2 border-stone-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 text-base font-medium text-stone-900 bg-stone-50/50 shadow-inner"
          />
        </div>

        {/* Submit Analyze Button */}
        <button
          id="explain-submit-analyze-btn"
          type="button"
          disabled={isLoading || (!inputText.trim() && !imageBase64)}
          onClick={() => handleAnalyze()}
          className="w-full py-4 px-6 rounded-2xl bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white font-extrabold text-lg shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 focus:ring-4 focus:ring-sky-300"
        >
          {isLoading ? (
            <Sparkles className="w-6 h-6 animate-spin" />
          ) : (
            <FileCheck className="w-6 h-6" />
          )}
          <span>
            {isLoading
              ? isHindi
                ? 'समझ रहे हैं...'
                : 'Analyzing...'
              : isHindi
              ? 'साथी, इसे सरल भाषा में समझाइए'
              : 'Explain This in Simple Words'}
          </span>
        </button>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <LoadingState
          message={isHindi ? 'साथी आपके दस्तावेज़ को समझ रहा है...' : 'SAATHI is reading and understanding this bill...'}
          subMessage={isHindi ? 'राशि और अंतिम तिथि निकाली जा रही है' : 'Extracting amount, due date, and necessary actions'}
        />
      )}

      {/* Structured Result Display (Section 7 & 13) */}
      {analysisResult && (
        <div
          id="explain-result-card"
          className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-sky-300 shadow-lg space-y-6 animate-in slide-in-from-bottom-3 duration-300"
        >
          {/* Top Result Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 font-extrabold text-xs uppercase tracking-wider">
                  {analysisResult.documentType}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    analysisResult.urgency === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : analysisResult.urgency === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {analysisResult.urgency} Urgency
                </span>
              </div>
              <h3 className="text-2xl font-black text-stone-900 mt-2">
                {analysisResult.documentType}
              </h3>
            </div>

            <button
              onClick={handleReadAloudToggle}
              className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm border border-amber-300 transition-colors shadow-2xs"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" />
                  <span>{isHindi ? 'आवाज़ बंद करें' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-700" />
                  <span>{isHindi ? 'बोलकर सुनाएँ' : 'Listen Aloud'}</span>
                </>
              )}
            </button>
          </div>

          {/* Simple Explanation (Principle 3: AI Must Explain, Not Just Answer) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">
              {isHindi ? 'सरल सारांश' : 'Simple Explanation'}
            </span>
            <p className="text-lg font-bold text-stone-900 leading-relaxed">
              "{analysisResult.simpleSummary}"
            </p>
          </div>

          {/* Extracted Key Facts: Amount, Due Date, Required Action */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Amount */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                {isHindi ? 'कुल राशि' : 'Amount'}
              </span>
              <span className="text-2xl font-black text-stone-900 block mt-1">
                {analysisResult.amount !== null
                  ? `${analysisResult.currency || '₹'}${analysisResult.amount.toLocaleString()}`
                  : 'N/A'}
              </span>
            </div>

            {/* Due Date */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                {isHindi ? 'अंतिम तिथि' : 'Due Date'}
              </span>
              <span className="text-xl font-black text-stone-900 block mt-1">
                {analysisResult.dueDate || (isHindi ? 'लागू नहीं' : 'Not specified')}
              </span>
            </div>

            {/* Required Action */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                {isHindi ? 'ज़रूरी कार्य' : 'Required Action'}
              </span>
              <span className="text-sm font-bold text-stone-800 block mt-1 leading-snug">
                {analysisResult.requiredAction || (isHindi ? 'केवल समीक्षा' : 'Review only')}
              </span>
            </div>
          </div>

          {/* Important Information list */}
          {analysisResult.importantInformation &&
            analysisResult.importantInformation.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-stone-800 uppercase tracking-wider">
                  {isHindi ? 'मुख्य बिंदु' : 'Important Details'}
                </h4>
                <ul className="space-y-2">
                  {analysisResult.importantInformation.map((info, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-base font-semibold text-stone-800"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Missing or unclear information banner */}
          {analysisResult.missingInformation &&
            analysisResult.missingInformation.length > 0 && (
              <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-stone-700 text-sm font-semibold flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isHindi ? 'अस्पष्ट या छूटी हुई जानकारी: ' : 'Unclear Information: '}
                  </span>
                  <span>{analysisResult.missingInformation.join(', ')}</span>
                </div>
              </div>
            )}

          {/* Connected Workflow: Proactive Reminder Suggestion (Journey 2) */}
          {analysisResult.suggestedReminder?.recommended && (
            <div
              id="suggested-reminder-card"
              className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700 animate-bounce" />
                <h4 className="text-base font-extrabold text-emerald-950">
                  {isHindi ? 'क्या मैं आपको याद दिला दूँ?' : 'Would you like a reminder?'}
                </h4>
              </div>

              <p className="text-base font-bold text-stone-800">
                {isHindi
                  ? `अंतिम तिथि से एक दिन पहले (${
                      analysisResult.suggestedReminder.date || '23 September 2026'
                    }) सुबह ${
                      analysisResult.suggestedReminder.time || '09:00 AM'
                    } पर याद दिलाने के लिए रिमाइंडर बनाएँ?`
                  : `Remind you one day before the due date on ${
                      analysisResult.suggestedReminder.date || '23 September 2026'
                    } at ${analysisResult.suggestedReminder.time || '09:00 AM'}?`}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  id="explain-remind-me-btn"
                  onClick={() => setIsReminderDialogOpen(true)}
                  className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-base shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Bell className="w-5 h-5" />
                  <span>{isHindi ? 'हाँ, याद दिलाएं' : 'Remind Me'}</span>
                </button>
                <button
                  onClick={() => {
                    showToast(isHindi ? 'ठीक है, धन्यवाद!' : 'Okay, no reminder set.');
                  }}
                  className="py-3 px-6 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-base"
                >
                  {isHindi ? 'नहीं, ज़रूरत नहीं' : 'No Thanks'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog before saving Reminder (Principle 4: Keep the user in control) */}
      <ConfirmationDialog
        isOpen={isReminderDialogOpen}
        title={isHindi ? 'रिमाइंडर जोड़ें?' : 'Create Reminder Confirmation'}
        message={
          isHindi
            ? `मैं ${
                analysisResult?.suggestedReminder.date || '23 September'
              } को सुबह ${
                analysisResult?.suggestedReminder.time || '9:00 AM'
              } पर "${
                analysisResult?.suggestedReminder.title || 'बिजली बिल भुगतान'
              }" के लिए रिमाइंडर बनाने जा रहा हूँ। क्या यह सही है?`
            : `I'm about to create a reminder for "${
                analysisResult?.suggestedReminder.title || 'Electricity Bill Payment'
              }" on ${
                analysisResult?.suggestedReminder.date || '23 September 2026'
              } at ${
                analysisResult?.suggestedReminder.time || '9:00 AM'
              }. Is that okay?`
        }
        confirmLabel={isHindi ? 'हाँ, रिमाइंडर बनाएँ' : 'Yes, create reminder'}
        cancelLabel={isHindi ? 'रद्द करें' : 'Cancel'}
        onConfirm={handleCreateSuggestedReminder}
        onCancel={() => setIsReminderDialogOpen(false)}
      />
    </div>
  );
};
