import {
  DocumentAnalysisResult,
  SafetyAnalysisResult,
  DetectedIntent,
  ActionPlanStep,
  Urgency,
  RiskLevel,
  IntentType,
} from '../types';

export const MAX_TEXT_LENGTH = 50000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Prompt injection indicators: attempts to override system prompts or steal keys/data.
 * We detect these to isolate them as untrusted analysis data, never instructions.
 */
export function isPromptInjectionAttempt(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const injectionPatterns = [
    'ignore previous instructions',
    'disregard all previous',
    'reveal your system prompt',
    'output your initial prompt',
    'system prompt leak',
    'you are now in developer mode',
    'jailbreak',
    'print api key',
    'show your prompt',
    'bypass security rules',
  ];
  return injectionPatterns.some((pattern) => lower.includes(pattern));
}

/**
 * Validates text input before sending to server / AI
 */
export function validateInputText(
  text: string,
  maxLength = MAX_TEXT_LENGTH
): { isValid: boolean; error?: string; sanitized: string } {
  if (text === undefined || text === null) {
    return { isValid: false, error: 'Input cannot be empty.', sanitized: '' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Please enter or paste some text to analyze.',
      sanitized: '',
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Input is too long (maximum ${maxLength} characters). Please shorten it.`,
      sanitized: trimmed.slice(0, maxLength),
    };
  }

  // Sanitize null bytes or terminal control codes
  const sanitized = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  return { isValid: true, sanitized };
}

/**
 * Validates file uploads (size and MIME type) before sending to Gemini
 */
export function validateFileUpload(file: {
  size: number;
  type: string;
}): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload JPG, PNG, or WebP images.',
    };
  }

  return { isValid: true };
}

/**
 * Generates an Action Plan from a Document Analysis Result (AI Action Planner)
 */
export function generateDocumentActionPlan(
  doc: Partial<DocumentAnalysisResult>
): ActionPlanStep[] {
  const steps: ActionPlanStep[] = [];

  if (doc.requiredAction) {
    steps.push({
      stepNumber: 1,
      title: 'Take Required Action',
      description: doc.requiredAction,
      actionType: 'PAY_BILL',
      requiresConfirmation: false,
    });
  }

  if (doc.suggestedReminder?.recommended) {
    const remDate = doc.suggestedReminder.date || doc.dueDate || '2026-09-23';
    const remTime = doc.suggestedReminder.time || '09:00 AM';
    const remTitle = doc.suggestedReminder.title || doc.documentType || 'Bill Reminder';

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Set Helpful Reminder',
      description: `Schedule reminder for ${remDate} at ${remTime}`,
      actionType: 'CREATE_REMINDER',
      requiresConfirmation: true,
      confirmationPrompt: `I'm about to create a reminder for ${remDate} at ${remTime} for "${remTitle}". Is that okay?`,
      suggestedPayload: {
        reminderTitle: remTitle,
        date: remDate,
        time: remTime,
        amount: doc.amount,
      },
    });
  }

  return steps;
}

/**
 * Generates an Action Plan from a Safety Analysis Result (AI Action Planner)
 */
export function generateSafetyActionPlan(
  safety: Partial<SafetyAnalysisResult>
): ActionPlanStep[] {
  const steps: ActionPlanStep[] = [];

  if (safety.riskLevel === 'HIGH' || safety.riskLevel === 'MEDIUM') {
    steps.push({
      stepNumber: 1,
      title: 'Do Not Engage',
      description: 'Do not click links, send money, or share OTP / passwords.',
      actionType: 'BLOCK_SENDER',
      requiresConfirmation: false,
    });

    steps.push({
      stepNumber: 2,
      title: 'Notify Trusted Family Member',
      description: 'Alert your family contact about this suspicious message.',
      actionType: 'NOTIFY_FAMILY',
      requiresConfirmation: true,
      confirmationPrompt:
        'Would you like me to send a safety alert to your trusted family member?',
    });
  } else {
    steps.push({
      stepNumber: 1,
      title: 'Proceed with Standard Care',
      description: 'No immediate scam indicators detected. Verify sender if unknown.',
      actionType: 'VERIFY_OFFICIALLY',
      requiresConfirmation: false,
    });
  }

  return steps;
}

/**
 * Validates and safely normalizes Document Analysis responses from Gemini or backend
 */
export function validateDocumentAnalysis(raw: any): DocumentAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid document analysis response format');
  }

  const documentType =
    typeof raw.documentType === 'string' && raw.documentType.trim()
      ? raw.documentType.trim()
      : 'Official Document';

  const simpleSummary =
    typeof raw.simpleSummary === 'string' && raw.simpleSummary.trim()
      ? raw.simpleSummary.trim()
      : 'Document analyzed. Please review important details below.';

  const importantInformation = Array.isArray(raw.importantInformation)
    ? raw.importantInformation.filter((item: any) => typeof item === 'string')
    : [];

  let amount: number | null = null;
  if (typeof raw.amount === 'number' && !isNaN(raw.amount)) {
    amount = raw.amount;
  } else if (typeof raw.amount === 'string') {
    const parsed = parseFloat(raw.amount.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) amount = parsed;
  }

  const currency = typeof raw.currency === 'string' ? raw.currency : '₹';
  const dueDate = typeof raw.dueDate === 'string' ? raw.dueDate : null;
  const requiredAction =
    typeof raw.requiredAction === 'string' ? raw.requiredAction : null;

  const validUrgencies: Urgency[] = ['LOW', 'MEDIUM', 'HIGH'];
  const urgency: Urgency = validUrgencies.includes(raw.urgency)
    ? raw.urgency
    : 'MEDIUM';

  const missingInformation = Array.isArray(raw.missingInformation)
    ? raw.missingInformation.filter((item: any) => typeof item === 'string')
    : [];

  const confidence =
    typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
      ? Math.round(raw.confidence * 100) / 100
      : 0.92;

  const confidenceNotes =
    typeof raw.confidenceNotes === 'string'
      ? raw.confidenceNotes
      : confidence < 0.7
      ? 'I am not fully confident with some extracted details. Please verify with original.'
      : undefined;

  const suggestedReminder = {
    recommended: Boolean(raw.suggestedReminder?.recommended),
    title:
      typeof raw.suggestedReminder?.title === 'string'
        ? raw.suggestedReminder.title
        : `Pay ${documentType}`,
    date:
      typeof raw.suggestedReminder?.date === 'string'
        ? raw.suggestedReminder.date
        : dueDate,
    time:
      typeof raw.suggestedReminder?.time === 'string'
        ? raw.suggestedReminder.time
        : '09:00 AM',
  };

  const validated: DocumentAnalysisResult = {
    documentType,
    simpleSummary,
    importantInformation,
    amount,
    currency,
    dueDate,
    requiredAction,
    urgency,
    missingInformation,
    confidence,
    confidenceNotes,
    suggestedReminder,
  };

  validated.actionPlan = generateDocumentActionPlan(validated);
  return validated;
}

/**
 * Validates and safely normalizes Safety Analysis responses
 */
export function validateSafetyAnalysis(raw: any): SafetyAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid safety analysis response format');
  }

  const validRiskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
  const riskLevel: RiskLevel = validRiskLevels.includes(raw.riskLevel)
    ? raw.riskLevel
    : 'HIGH';

  const summary =
    typeof raw.summary === 'string' && raw.summary.trim()
      ? raw.summary.trim()
      : 'Suspicious pattern detected. Exercise caution.';

  const indicators = Array.isArray(raw.indicators)
    ? raw.indicators.filter((item: any) => typeof item === 'string')
    : [];

  const recommendedActions = Array.isArray(raw.recommendedActions)
    ? raw.recommendedActions.filter((item: any) => typeof item === 'string')
    : [
        'Do not click any unverified links.',
        'Never share OTP or banking passwords.',
      ];

  const thingsToAvoid = Array.isArray(raw.thingsToAvoid)
    ? raw.thingsToAvoid.filter((item: any) => typeof item === 'string')
    : ['Never share passwords or transfer funds based on unverified messages.'];

  const familyNotificationRecommended =
    typeof raw.familyNotificationRecommended === 'boolean'
      ? raw.familyNotificationRecommended
      : riskLevel === 'HIGH';

  const confidence =
    typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
      ? Math.round(raw.confidence * 100) / 100
      : 0.94;

  const confidenceNotes =
    typeof raw.confidenceNotes === 'string'
      ? raw.confidenceNotes
      : confidence < 0.75
      ? 'Evidence is limited. Treat message cautiously.'
      : undefined;

  const validated: SafetyAnalysisResult = {
    riskLevel,
    summary,
    indicators,
    recommendedActions,
    thingsToAvoid,
    familyNotificationRecommended,
    confidence,
    confidenceNotes,
  };

  validated.actionPlan = generateSafetyActionPlan(validated);
  return validated;
}

/**
 * Validates and safely normalizes Natural Language Intent responses
 */
export function validateDetectedIntent(raw: any): DetectedIntent {
  if (!raw || typeof raw !== 'object') {
    return {
      intent: 'GENERAL_HELP',
      language: 'en',
      confidence: 0.8,
      entities: { title: null, date: null, time: null, amount: null },
      conversationalReply: 'I am here to assist you. How can I help today?',
    };
  }

  const validIntents: IntentType[] = [
    'GENERAL_HELP',
    'EXPLAIN_DOCUMENT',
    'CHECK_SAFETY',
    'CREATE_REMINDER',
    'CREATE_APPOINTMENT',
    'VIEW_REMINDERS',
    'HELP_WITH_TASK',
  ];

  const intent: IntentType = validIntents.includes(raw.intent)
    ? raw.intent
    : 'GENERAL_HELP';

  const language =
    raw.language === 'hi' || raw.language === 'hinglish' ? raw.language : 'en';

  const confidence =
    typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
      ? Math.round(raw.confidence * 100) / 100
      : 0.9;

  const entities = {
    title: typeof raw.entities?.title === 'string' ? raw.entities.title : null,
    date: typeof raw.entities?.date === 'string' ? raw.entities.date : null,
    time: typeof raw.entities?.time === 'string' ? raw.entities.time : null,
    amount:
      typeof raw.entities?.amount === 'number'
        ? raw.entities.amount
        : typeof raw.entities?.amount === 'string'
        ? parseFloat(raw.entities.amount) || null
        : null,
    category: raw.entities?.category || null,
  };

  const conversationalReply =
    typeof raw.conversationalReply === 'string' && raw.conversationalReply.trim()
      ? raw.conversationalReply.trim()
      : 'I am here to help you.';

  return {
    intent,
    language,
    confidence,
    entities,
    conversationalReply,
  };
}
