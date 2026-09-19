import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Reminder,
  UserSettings,
  FamilyNotificationEvent,
  Language,
  TextSize,
} from '../types';
import { INITIAL_REMINDERS, INITIAL_SETTINGS } from '../data/demoData';

interface AppContextType {
  activeTab: 'home' | 'explain' | 'safety' | 'reminders' | 'settings';
  setActiveTab: (tab: 'home' | 'explain' | 'safety' | 'reminders' | 'settings') => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Reminder;
  toggleReminderStatus: (id: string) => void;
  deleteReminder: (id: string) => void;
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  isTalkModalOpen: boolean;
  setIsTalkModalOpen: (open: boolean) => void;
  talkInitialQuery: string | null;
  openTalkWithPrompt: (prompt: string) => void;
  familyNotifications: FamilyNotificationEvent[];
  notifyFamily: (event: { message: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }) => FamilyNotificationEvent;
  resetDemoData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  explainPreloadText: string | null;
  setExplainPreloadText: (text: string | null) => void;
  safetyPreloadText: string | null;
  setSafetyPreloadText: (text: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_REMINDERS_KEY = 'saathi_ai_reminders_v1';
const STORAGE_SETTINGS_KEY = 'saathi_ai_settings_v1';
const STORAGE_FAMILY_KEY = 'saathi_ai_family_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'explain' | 'safety' | 'reminders' | 'settings'>('home');
  const [isTalkModalOpen, setIsTalkModalOpen] = useState(false);
  const [talkInitialQuery, setTalkInitialQuery] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [explainPreloadText, setExplainPreloadText] = useState<string | null>(null);
  const [safetyPreloadText, setSafetyPreloadText] = useState<string | null>(null);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REMINDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load reminders from localStorage:', e);
    }
    return INITIAL_REMINDERS;
  });

  // Settings state
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return INITIAL_SETTINGS;
  });

  // Family Notifications
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotificationEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAMILY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load family notifications:', e);
    }
    return [];
  });

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(reminders));
    } catch (e) {
      console.warn('Error saving reminders:', e);
    }
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAMILY_KEY, JSON.stringify(familyNotifications));
    } catch (e) {
      console.warn('Error saving family notifications:', e);
    }
  }, [familyNotifications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const addReminder = (data: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
    const newRem: Reminder = {
      ...data,
      id: `rem-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);
    showToast(
      settings.language === 'hi'
        ? `रिमाइंडर जोड़ा गया: "${newRem.title}"`
        : `Added reminder: "${newRem.title}"`
    );
    return newRem;
  };

  const toggleReminderStatus = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
          showToast(
            newStatus === 'COMPLETED'
              ? settings.language === 'hi'
                ? `रिमाइंडर पूर्ण चिह्नित किया गया: ${r.title}`
                : `Marked completed: ${r.title}`
              : settings.language === 'hi'
                ? `रिमाइंडर पुनः सक्रिय: ${r.title}`
                : `Marked pending: ${r.title}`
          );
          return { ...r, status: newStatus };
        }
        return r;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast(
      settings.language === 'hi' ? 'रिमाइंडर हटा दिया गया' : 'Reminder deleted'
    );
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const openTalkWithPrompt = (prompt: string) => {
    setTalkInitialQuery(prompt);
    setIsTalkModalOpen(true);
  };

  const notifyFamily = (event: { message: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
    const newEvent: FamilyNotificationEvent = {
      id: `fam-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: event.message,
      riskLevel: event.riskLevel,
      contactName: `${settings.trustedContactName} (${settings.trustedContactRelation})`,
      status: 'SENT_SIMULATED',
    };
    setFamilyNotifications((prev) => [newEvent, ...prev]);
    showToast(
      settings.language === 'hi'
        ? `परिवार को सूचित किया गया: ${settings.trustedContactName} (${settings.trustedContactRelation})`
        : `Family member notified: ${settings.trustedContactName} (${settings.trustedContactRelation})`
    );
    return newEvent;
  };

  const resetDemoData = () => {
    setReminders(INITIAL_REMINDERS);
    setSettings(INITIAL_SETTINGS);
    setFamilyNotifications([]);
    localStorage.removeItem(STORAGE_REMINDERS_KEY);
    localStorage.removeItem(STORAGE_SETTINGS_KEY);
    localStorage.removeItem(STORAGE_FAMILY_KEY);
    showToast('Demo data reset to original state.');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        reminders,
        addReminder,
        toggleReminderStatus,
        deleteReminder,
        settings,
        updateSettings,
        isTalkModalOpen,
        setIsTalkModalOpen,
        talkInitialQuery,
        openTalkWithPrompt,
        familyNotifications,
        notifyFamily,
        resetDemoData,
        toastMessage,
        showToast,
        explainPreloadText,
        setExplainPreloadText,
        safetyPreloadText,
        setSafetyPreloadText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
