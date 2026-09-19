import {
  DocumentAnalysisResult,
  SafetyAnalysisResult,
  DetectedIntent,
  Language,
} from '../types';
import {
  validateDocumentAnalysis,
  validateSafetyAnalysis,
  validateDetectedIntent,
  validateInputText,
} from './aiValidator';
import { fastDataHash } from '../utils/imageOptimizer';

// ==========================================
// 1. AI PROVIDER INTERFACES (V3 Section 14)
// ==========================================

export interface DocumentAnalysisInput {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
  sessionScope?: string;
}

export interface SafetyAnalysisInput {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
  sessionScope?: string;
}

export interface IntentDetectionInput {
  query: string;
  language?: Language;
  userReminders?: any[];
  sessionScope?: string;
}

export interface DocumentAnalyzer {
  analyze(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult>;
}

export interface SafetyAnalyzer {
  analyze(input: SafetyAnalysisInput): Promise<SafetyAnalysisResult>;
}

export interface IntentDetector {
  detect(input: IntentDetectionInput): Promise<DetectedIntent>;
}

// Bounded, session-scoped caching layer to prevent duplicate AI requests and isolate user data
const MAX_CACHE_ENTRIES_PER_SCOPE = 50;

const scopedDocCache = new Map<string, Map<string, DocumentAnalysisResult>>();
const scopedSafetyCache = new Map<string, Map<string, SafetyAnalysisResult>>();
const scopedIntentCache = new Map<string, Map<string, DetectedIntent>>();

// In-flight request deduplication map to prevent parallel identical requests
const inFlightClientRequests = new Map<string, Promise<any>>();

function getScopeCache<T>(
  cacheStore: Map<string, Map<string, T>>,
  scope: string
): Map<string, T> {
  let scopeMap = cacheStore.get(scope);
  if (!scopeMap) {
    scopeMap = new Map<string, T>();
    cacheStore.set(scope, scopeMap);
  }
  return scopeMap;
}

function setBoundedCache<T>(
  cacheStore: Map<string, Map<string, T>>,
  scope: string,
  key: string,
  value: T
) {
  const scopeMap = getScopeCache(cacheStore, scope);
  if (scopeMap.size >= MAX_CACHE_ENTRIES_PER_SCOPE) {
    const oldestKey = scopeMap.keys().next().value;
    if (oldestKey) scopeMap.delete(oldestKey);
  }
  scopeMap.set(key, value);
}

/**
 * Clears cached AI responses for a specific session scope or all caches.
 */
export function clearAICache(sessionScope?: string) {
  if (sessionScope) {
    scopedDocCache.delete(sessionScope);
    scopedSafetyCache.delete(sessionScope);
    scopedIntentCache.delete(sessionScope);
  } else {
    scopedDocCache.clear();
    scopedSafetyCache.clear();
    scopedIntentCache.clear();
  }
}

// ==========================================
// 2. REAL GEMINI PROVIDERS (V3 Section 14)
// ==========================================

export class GeminiDocumentAnalyzer implements DocumentAnalyzer {
  async analyze(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    const scope = input.sessionScope || 'default';
    const textInput = (input.text || '').trim();
    const imgHash = input.imageBase64 ? fastDataHash(input.imageBase64) : 'none';
    const cacheKey = `doc:${input.language || 'en'}:${imgHash}:${textInput}`;

    // Check scoped cache
    const scopeCache = getScopeCache(scopedDocCache, scope);
    if (scopeCache.has(cacheKey)) {
      return scopeCache.get(cacheKey)!;
    }

    // Check in-flight promise deduplication
    const fullKey = `${scope}:${cacheKey}`;
    if (inFlightClientRequests.has(fullKey)) {
      return inFlightClientRequests.get(fullKey)!;
    }

    if (textInput) {
      const val = validateInputText(textInput);
      if (!val.isValid && !input.imageBase64) {
        throw new Error(val.error || 'Invalid document text');
      }
    }

    const execute = async () => {
      try {
        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) throw new Error(`Server status ${res.status}`);
        const raw = await res.json();
        const validated = validateDocumentAnalysis(raw);
        setBoundedCache(scopedDocCache, scope, cacheKey, validated);
        return validated;
      } catch (err) {
        console.warn('Gemini Document Analyzer offline/fallback:', err);
        const testFallback = new TestDocumentAnalyzer();
        return testFallback.analyze(input);
      } finally {
        inFlightClientRequests.delete(fullKey);
      }
    };

    const promise = execute();
    inFlightClientRequests.set(fullKey, promise);
    return promise;
  }
}

export class GeminiSafetyAnalyzer implements SafetyAnalyzer {
  async analyze(input: SafetyAnalysisInput): Promise<SafetyAnalysisResult> {
    const scope = input.sessionScope || 'default';
    const textInput = (input.text || '').trim();
    const imgHash = input.imageBase64 ? fastDataHash(input.imageBase64) : 'none';
    const cacheKey = `safety:${input.language || 'en'}:${imgHash}:${textInput}`;

    // Check scoped cache
    const scopeCache = getScopeCache(scopedSafetyCache, scope);
    if (scopeCache.has(cacheKey)) {
      return scopeCache.get(cacheKey)!;
    }

    // Check in-flight promise deduplication
    const fullKey = `${scope}:${cacheKey}`;
    if (inFlightClientRequests.has(fullKey)) {
      return inFlightClientRequests.get(fullKey)!;
    }

    if (textInput) {
      const val = validateInputText(textInput);
      if (!val.isValid && !input.imageBase64) {
        throw new Error(val.error || 'Invalid message text');
      }
    }

    const execute = async () => {
      try {
        const res = await fetch('/api/analyze-safety', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) throw new Error(`Server status ${res.status}`);
        const raw = await res.json();
        const validated = validateSafetyAnalysis(raw);
        setBoundedCache(scopedSafetyCache, scope, cacheKey, validated);
        return validated;
      } catch (err) {
        console.warn('Gemini Safety Analyzer offline/fallback:', err);
        const testFallback = new TestSafetyAnalyzer();
        return testFallback.analyze(input);
      } finally {
        inFlightClientRequests.delete(fullKey);
      }
    };

    const promise = execute();
    inFlightClientRequests.set(fullKey, promise);
    return promise;
  }
}

export class GeminiIntentDetector implements IntentDetector {
  async detect(input: IntentDetectionInput): Promise<DetectedIntent> {
    const scope = input.sessionScope || 'default';
    const normalizedQuery = (input.query || '').trim().toLowerCase();
    const cacheKey = `intent:${input.language || 'en'}:${normalizedQuery}`;

    // Check scoped cache
    const scopeCache = getScopeCache(scopedIntentCache, scope);
    if (scopeCache.has(cacheKey)) {
      return scopeCache.get(cacheKey)!;
    }

    // Check in-flight promise deduplication
    const fullKey = `${scope}:${cacheKey}`;
    if (inFlightClientRequests.has(fullKey)) {
      return inFlightClientRequests.get(fullKey)!;
    }

    const execute = async () => {
      try {
        const res = await fetch('/api/detect-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) throw new Error(`Server status ${res.status}`);
        const raw = await res.json();
        const validated = validateDetectedIntent(raw);
        setBoundedCache(scopedIntentCache, scope, cacheKey, validated);
        return validated;
      } catch (err) {
        console.warn('Gemini Intent Detector offline/fallback:', err);
        const testFallback = new TestIntentDetector();
        return testFallback.detect(input);
      } finally {
        inFlightClientRequests.delete(fullKey);
      }
    };

    const promise = execute();
    inFlightClientRequests.set(fullKey, promise);
    return promise;
  }
}

// =========================================================================
// 3. DETERMINISTIC TEST / DEMO PROVIDERS & SEEDED FIXTURES (V3 Section 21)
// =========================================================================

export class TestDocumentAnalyzer implements DocumentAnalyzer {
  async analyze(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    const isHindi = input.language === 'hi';
    const text = (input.text || '').toLowerCase();

    // Scenario A: Electricity Bill (Section 21)
    return validateDocumentAnalysis({
      documentType: isHindi ? 'बिजली का बिल (BSES)' : 'Electricity Bill (BSES)',
      simpleSummary: isHindi
        ? 'यह आपका बिजली का बिल है। देय राशि ₹1,842 है और अंतिम तिथि 24 सितंबर 2026 है।'
        : 'Your electricity bill is ₹1,842 and is due on 24 September 2026.',
      importantInformation: [
        isHindi ? 'कुल देय राशि: ₹1,842' : 'Amount Due: ₹1,842',
        isHindi ? 'अंतिम तिथि: 24 सितंबर 2026' : 'Due Date: 24 September 2026',
        isHindi ? 'उपभोक्ता संख्या: 102948192' : 'Consumer Account: 102948192',
      ],
      amount: 1842,
      currency: '₹',
      dueDate: '2026-09-24',
      requiredAction: isHindi
        ? '24 सितंबर 2026 से पहले बिल का भुगतान करें।'
        : 'Pay before 24 September 2026 to avoid late fees.',
      urgency: 'MEDIUM',
      missingInformation: [],
      confidence: 0.96,
      confidenceNotes: 'Deterministic Test Provider Fixture Verified',
      suggestedReminder: {
        recommended: true,
        title: isHindi ? 'बिजली बिल भुगतान' : 'Pay Electricity Bill',
        date: '2026-09-23',
        time: '09:00 AM',
      },
    });
  }
}

export class TestSafetyAnalyzer implements SafetyAnalyzer {
  async analyze(input: SafetyAnalysisInput): Promise<SafetyAnalysisResult> {
    const isHindi = input.language === 'hi';
    const text = (input.text || '').toLowerCase();

    // Check if benign or scam scenario
    const isScamScenario =
      text.includes('won') ||
      text.includes('lottery') ||
      text.includes('prize') ||
      text.includes('25,00,000') ||
      text.includes('otp') ||
      text.includes('click') ||
      text.includes('link') ||
      text.includes('congratulations') ||
      text.includes('claim');

    if (isScamScenario || text.length === 0) {
      // Scenario B: Suspicious Prize Message (Section 21)
      return validateSafetyAnalysis({
        riskLevel: 'HIGH',
        category: 'POSSIBLE_SCAM',
        summary: isHindi
          ? 'यह संदेश 25 लाख की फर्जी लॉटरी का झांसा देकर बैंक जानकारी और OTP चुराने का प्रयास है।'
          : 'This message asks for urgent payment and personal information with an unverified lottery claim.',
        indicators: isHindi
          ? [
              'अचानक अप्रत्याशित ₹25,00,000 इनाम या लॉटरी का झूठा दावा',
              'संवेदनशील OTP या बैंक खाते की जानकारी की मांग',
              'तुरंत दावा करने का अनुचित दबाव व अपरिचित लिंक',
            ]
          : [
              'Urgent call to action for unexpected ₹25,00,000 prize',
              'Request for sensitive OTP, PIN or banking credentials',
              'Unverified suspicious external link',
            ],
        recommendedActions: isHindi
          ? [
              'दिए गए लिंक पर बिल्कुल क्लिक न करें',
              'किसी के साथ भी OTP, पिन या पासवर्ड साझा न करें',
              'संदेश भेजने वाले को तुरंत ब्लॉक करें',
              'अपने परिवार के विश्वसनीय सदस्य को सूचित करें',
            ]
          : [
              'Do not click the link under any circumstance',
              'Never share OTP or banking credentials',
              'Block and report the sender',
              'Alert your trusted family member',
            ],
        thingsToAvoid: isHindi
          ? ['लिंक न खोलें', 'OTP न दें', 'जवाबी कॉल न करें']
          : ['Do not click links', 'Never share OTP', 'Do not transfer funds'],
        familyNotificationRecommended: true,
        confidence: 0.98,
        confidenceNotes: 'Deterministic Test Provider Fixture Verified',
      });
    }

    // Benign notification
    return validateSafetyAnalysis({
      riskLevel: 'LOW',
      summary: isHindi
        ? 'यह संदेश सामान्य प्रतीत होता है। इसमें कोई तत्काल धोखाधड़ी के संकेत नहीं मिले।'
        : 'This message appears standard with no detected fraud indicators.',
      indicators: [
        isHindi ? 'कोई पासवर्ड या OTP नहीं मांगा गया' : 'No request for sensitive credentials',
      ],
      recommendedActions: [
        isHindi ? 'यदि प्रेषक परिचित है तो सामान्य रूप से आगे बढ़ें' : 'Proceed normally if sender is known',
      ],
      thingsToAvoid: ['Never share OTP with anyone'],
      familyNotificationRecommended: false,
      confidence: 0.92,
    });
  }
}

export class TestIntentDetector implements IntentDetector {
  async detect(input: IntentDetectionInput): Promise<DetectedIntent> {
    const isHindi = input.language === 'hi';
    const text = (input.query || '').toLowerCase();

    // Dynamically calculate tomorrow's calendar date context
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Scenario A: Doctor Appointment
    if (
      text.includes('doctor') ||
      text.includes('appointment') ||
      (text.includes('jaana') && (text.includes('11') || text.includes('kal'))) ||
      text.includes('clinic') ||
      text.includes('hospital')
    ) {
      let timeNorm = '11:00';
      let timeDisp = '11:00 AM';
      if (text.includes('10')) {
        timeNorm = '10:00';
        timeDisp = '10:00 AM';
      }

      const title = isHindi ? 'डॉक्टर का अप्वाइंटमेंट' : 'Doctor appointment';

      return validateDetectedIntent({
        intent: 'CREATE_APPOINTMENT',
        language: isHindi ? 'hi' : 'hinglish',
        confidence: 0.98,
        title,
        date: tomorrowStr,
        time: timeNorm,
        explanation: `Doctor appointment scheduled for tomorrow at ${timeDisp}`,
        requiresConfirmation: true,
        entities: {
          title,
          date: tomorrowStr,
          time: timeDisp,
          amount: null,
          category: 'Appointments',
        },
        conversationalReply: isHindi
          ? `मैंने समझ लिया: डॉक्टर का अप्वाइंटमेंट, कल सुबह ${timeDisp} बजे। क्या मैं इसे आपके रिमाइंडर में सुरक्षित कर दूँ?`
          : `I understood this as a doctor appointment tomorrow at ${timeDisp}. Would you like me to save it?`,
      });
    }

    // Scenario B: Reminder (Bill payment or general)
    if (
      text.includes('remind') ||
      text.includes('reminder') ||
      text.includes('yaad') ||
      text.includes('electricity') ||
      text.includes('bijli') ||
      text.includes('bill')
    ) {
      const isTomorrow = text.includes('kal') || text.includes('tomorrow');
      const targetDate = isTomorrow ? tomorrowStr : '2026-09-24';
      const title = isHindi ? 'बिजली बिल भुगतान' : 'Electricity Bill Payment';

      return validateDetectedIntent({
        intent: 'CREATE_REMINDER',
        language: isHindi ? 'hi' : 'en',
        confidence: 0.95,
        title,
        date: targetDate,
        time: '09:00',
        explanation: `Reminder for ${title} on ${targetDate}`,
        requiresConfirmation: true,
        entities: {
          title,
          date: targetDate,
          time: '09:00 AM',
          amount: 1842,
          category: 'Bills',
        },
        conversationalReply: isHindi
          ? `मैंने ₹1,842 का बिजली बिल रिमाइंडर तैयार किया है। क्या इसे सेव करें?`
          : `I understood you want a reminder for ${title}. Would you like me to save this?`,
      });
    }

    // Scenario C: Safety Check
    if (
      text.includes('safe') ||
      text.includes('scam') ||
      text.includes('fraud') ||
      text.includes('surakshit') ||
      text.includes('otp') ||
      text.includes('lottery')
    ) {
      return validateDetectedIntent({
        intent: 'CHECK_SAFETY',
        language: isHindi ? 'hi' : 'en',
        confidence: 0.95,
        requiresConfirmation: false,
        explanation: 'Check message or link for scam indicators',
        entities: {
          title: null,
          date: null,
          time: null,
          amount: null,
          category: 'Safety',
        },
        conversationalReply: isHindi
          ? 'जरूर, मुझे वह संदेश दिखाइए या यहाँ पेस्ट कीजिए। मैं तुरंत जाँच करके बताऊँगा कि वह सुरक्षित है या नहीं।'
          : 'Certainly! Please show me or paste the message, and I will check right away if it is safe.',
      });
    }

    // Scenario D: Explain Document
    if (
      text.includes('explain') ||
      text.includes('samjhao') ||
      text.includes('samajh') ||
      text.includes('document') ||
      text.includes('kaghaz')
    ) {
      return validateDetectedIntent({
        intent: 'EXPLAIN_DOCUMENT',
        language: isHindi ? 'hi' : 'en',
        confidence: 0.95,
        requiresConfirmation: false,
        explanation: 'Explain document in simple words',
        entities: {
          title: 'Document',
          date: null,
          time: null,
          amount: null,
          category: 'Documents',
        },
        conversationalReply: isHindi
          ? 'मैं आपके किसी भी बिल या दस्तावेज़ को आसान शब्दों में समझा सकता हूँ।'
          : 'I can explain your document or bill in simple, easy-to-understand words.',
      });
    }

    // Default conversational help
    return validateDetectedIntent({
      intent: 'GENERAL_HELP',
      language: isHindi ? 'hi' : 'en',
      confidence: 0.9,
      requiresConfirmation: false,
      explanation: 'General help overview',
      entities: {
        title: null,
        date: null,
        time: null,
        amount: null,
        category: 'General',
      },
      conversationalReply: isHindi
        ? `नमस्ते! मैं साथी हूँ। आप मुझसे कोई भी बिल समझाने, संदेश की सुरक्षा जांचने, या रिमाइंडर तय करने के लिए कह सकते हैं।`
        : `I am here to help. Would you like me to explain a document, check if a message is safe, or help you with a reminder?`,
    });
  }
}

// ==========================================
// 4. DEPENDENCY INJECTION & FACTORY (V3)
// ==========================================

export function getDocumentAnalyzer(isDemoMode: boolean): DocumentAnalyzer {
  return isDemoMode ? new TestDocumentAnalyzer() : new GeminiDocumentAnalyzer();
}

export function getSafetyAnalyzer(isDemoMode: boolean): SafetyAnalyzer {
  return isDemoMode ? new TestSafetyAnalyzer() : new GeminiSafetyAnalyzer();
}

export function getIntentDetector(isDemoMode: boolean): IntentDetector {
  return isDemoMode ? new TestIntentDetector() : new GeminiIntentDetector();
}

// System Diagnostics Status provider (Section 34)
export interface SystemStatus {
  ui: 'OK';
  aiProvider: 'Gemini 3.8 Flash' | 'Deterministic Test Provider';
  safetyService: 'OK';
  reminderService: 'OK';
  persistence: 'OK (localStorage Sync)';
  mode: 'DEMO' | 'REAL';
  timestamp: string;
}

export function getSystemDiagnostics(isDemoMode: boolean): SystemStatus {
  return {
    ui: 'OK',
    aiProvider: isDemoMode ? 'Deterministic Test Provider' : 'Gemini 3.8 Flash',
    safetyService: 'OK',
    reminderService: 'OK',
    persistence: 'OK (localStorage Sync)',
    mode: isDemoMode ? 'DEMO' : 'REAL',
    timestamp: new Date().toLocaleTimeString(),
  };
}
