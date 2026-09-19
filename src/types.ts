export type Language = 'en' | 'hi';

export type TextSize = 'normal' | 'large' | 'xlarge';

export type ReminderCategory =
  | 'Bills'
  | 'Appointments'
  | 'Documents'
  | 'Family'
  | 'General'
  | 'Safety';

export type ReminderStatus = 'PENDING' | 'COMPLETED';

export type ReminderSource =
  | 'DOCUMENT_ANALYSIS'
  | 'VOICE_ASSISTANT'
  | 'MANUAL'
  | 'SAFETY_CHECK';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD or readable
  time?: string; // HH:MM AM/PM
  amount?: number | null;
  currency?: string | null;
  category: ReminderCategory;
  status: ReminderStatus;
  source: ReminderSource;
  createdAt: string;
}

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DocumentAnalysisResult {
  documentType: string;
  simpleSummary: string;
  importantInformation: string[];
  amount: number | null;
  currency: string | null;
  dueDate: string | null;
  requiredAction: string | null;
  urgency: Urgency;
  missingInformation: string[];
  suggestedReminder: {
    recommended: boolean;
    title: string;
    date: string | null;
    time: string | null;
  };
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SafetyAnalysisResult {
  riskLevel: RiskLevel;
  summary: string;
  indicators: string[];
  recommendedActions: string[];
  thingsToAvoid: string[];
  familyNotificationRecommended: boolean;
  confidence: number;
}

export type IntentType =
  | 'GENERAL_HELP'
  | 'EXPLAIN_DOCUMENT'
  | 'CHECK_SAFETY'
  | 'CREATE_REMINDER'
  | 'CREATE_APPOINTMENT'
  | 'VIEW_REMINDERS'
  | 'HELP_WITH_TASK';

export interface DetectedIntent {
  intent: IntentType;
  language: 'en' | 'hi' | 'hinglish';
  confidence: number;
  entities: {
    title: string | null;
    date: string | null;
    time: string | null;
    amount: number | null;
    category?: ReminderCategory | null;
  };
  conversationalReply: string;
}

export interface UserSettings {
  userName: string;
  language: Language;
  textSize: TextSize;
  highContrast: boolean;
  autoReadAloud: boolean;
  trustedContactName: string;
  trustedContactPhone: string;
  trustedContactRelation: string;
}

export interface FamilyNotificationEvent {
  id: string;
  timestamp: string;
  message: string;
  riskLevel: RiskLevel;
  contactName: string;
  status: 'SENT_SIMULATED';
}
