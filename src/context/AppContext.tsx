import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Reminder,
  UserSettings,
  UserProfile,
  FamilyNotificationEvent,
  SafetyCheckRecord,
} from '../types';
import {
  DEMO_USER_PROFILE,
  DEMO_SETTINGS,
  DEMO_REMINDERS,
  createDefaultVisitorProfile,
  createDefaultVisitorSettings,
} from '../data/demoData';

interface AppContextType {
  activeTab: 'home' | 'explain' | 'safety' | 'reminders' | 'settings';
  setActiveTab: (tab: 'home' | 'explain' | 'safety' | 'reminders' | 'settings') => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  toggleDemoMode: () => void;
  isDiagnosticsOpen: boolean;
  setIsDiagnosticsOpen: (val: boolean) => void;
  // Session & User Isolation (P0)
  sessionId: string;
  userProfile: UserProfile;
  updateUserProfile: (partial: Partial<UserProfile>) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (val: boolean) => void;
  completeOnboarding: (data: {
    displayName: string;
    trustedContactName?: string;
    trustedContactRelation?: string;
    trustedContactPhone?: string;
  }) => void;
  resetSessionData: () => void;
  switchSession: (newSessionId: string) => void;
  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Reminder;
  toggleReminderStatus: (id: string) => void;
  deleteReminder: (id: string) => void;
  // Settings
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  // Talk Modal
  isTalkModalOpen: boolean;
  setIsTalkModalOpen: (open: boolean) => void;
  talkInitialQuery: string | null;
  openTalkWithPrompt: (prompt: string) => void;
  // Family & Safety
  familyNotifications: FamilyNotificationEvent[];
  notifyFamily: (event: { message: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }) => FamilyNotificationEvent;
  safetyChecks: SafetyCheckRecord[];
  addSafetyCheckRecord: (record: Omit<SafetyCheckRecord, 'id' | 'timestamp'>) => void;
  resetDemoData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  explainPreloadText: string | null;
  setExplainPreloadText: (text: string | null) => void;
  safetyPreloadText: string | null;
  setSafetyPreloadText: (text: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACTIVE_SESSION_KEY = 'saathi_active_session_id';
const STORAGE_DEMO_KEY = 'saathi_demo_mode_active';

const INITIAL_SAFETY_CHECKS: SafetyCheckRecord[] = [
  {
    id: 'sc-1',
    timestamp: 'Today, 09:15 AM',
    snippet: 'KBC Lottery: You have won Rs 25,00,000. Send bank details.',
    riskLevel: 'HIGH',
    summary: 'Unsolicited lottery scam demanding personal banking details.',
    confidence: 0.95,
  },
  {
    id: 'sc-2',
    timestamp: 'Yesterday, 04:30 PM',
    snippet: 'SBI Alert: Your OTP for login is 482910. Do not share with anyone.',
    riskLevel: 'LOW',
    summary: 'Standard bank transactional OTP notification.',
    confidence: 0.98,
  },
];

const generateSessionId = (): string => {
  return (
    'sess_' +
    Math.random().toString(36).substring(2, 9) +
    '_' +
    Date.now().toString(36)
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<
    'home' | 'explain' | 'safety' | 'reminders' | 'settings'
  >('home');

  // Detect demo mode from URL query (?mode=demo) or localStorage
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = window.location.search || '';
        const path = window.location.pathname || '';
        if (
          search.includes('mode=demo') ||
          search.includes('demo=true') ||
          path.startsWith('/demo')
        ) {
          return true;
        }
        return localStorage.getItem(STORAGE_DEMO_KEY) === 'true';
      }
    } catch (e) {
      console.warn('Error reading demo mode state:', e);
    }
    return false;
  });

  // Unique session ID for anonymous visitor isolation
  const [sessionId, setSessionId] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (existing) return existing;
        const newId = generateSessionId();
        localStorage.setItem(ACTIVE_SESSION_KEY, newId);
        return newId;
      }
    } catch (e) {
      console.warn('Failed to read or generate session ID:', e);
    }
    return generateSessionId();
  });

  const activeNamespace = isDemoMode ? 'demo' : sessionId;

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (isDemoMode) return DEMO_USER_PROFILE;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`saathi_profile_${sessionId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load user profile:', e);
    }
    return createDefaultVisitorProfile(sessionId);
  });

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (isDemoMode) return DEMO_SETTINGS;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`saathi_settings_${sessionId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return createDefaultVisitorSettings();
  });

  // Reminders State (Empty for fresh visitor, isolated from Mr. Sharma)
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem('saathi_reminders_demo');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load demo reminders:', e);
      }
      return DEMO_REMINDERS;
    }
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`saathi_reminders_${sessionId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load visitor reminders:', e);
    }
    return [];
  });

  // Family Notifications State
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotificationEvent[]>(() => {
    const key = `saathi_family_${activeNamespace}`;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load family notifications:', e);
    }
    return [];
  });

  // Safety Checks State
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheckRecord[]>(() => {
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem('saathi_safety_demo');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load demo safety checks:', e);
      }
      return INITIAL_SAFETY_CHECKS;
    }
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`saathi_safety_${sessionId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load visitor safety checks:', e);
    }
    return [];
  });

  // Onboarding Modal visibility: show when user is NOT onboarded and NOT in demo mode
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !isDemoMode && !userProfile.isOnboarded;
  });

  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isTalkModalOpen, setIsTalkModalOpen] = useState(false);
  const [talkInitialQuery, setTalkInitialQuery] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [explainPreloadText, setExplainPreloadText] = useState<string | null>(null);
  const [safetyPreloadText, setSafetyPreloadText] = useState<string | null>(null);

  // Synchronize route with browser URL on mount & popstate
  useEffect(() => {
    const parseRouteFromUrl = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'explain') setActiveTabState('explain');
      else if (path === 'safety') setActiveTabState('safety');
      else if (path === 'reminders' || path === 'my-day') setActiveTabState('reminders');
      else if (path === 'settings') setActiveTabState('settings');
      else if (path === 'home' || path === '' || path === 'demo') setActiveTabState('home');

      const search = window.location.search || '';
      if (
        search.includes('mode=demo') ||
        search.includes('demo=true') ||
        path.startsWith('/demo')
      ) {
        setIsDemoMode(true);
      }
    };

    parseRouteFromUrl();
    window.addEventListener('popstate', parseRouteFromUrl);
    return () => window.removeEventListener('popstate', parseRouteFromUrl);
  }, []);

  // Reload state whenever isDemoMode or sessionId changes to maintain strict isolation
  useEffect(() => {
    const ns = isDemoMode ? 'demo' : sessionId;
    try {
      localStorage.setItem(STORAGE_DEMO_KEY, String(isDemoMode));

      if (isDemoMode) {
        const savedProf = localStorage.getItem('saathi_profile_demo');
        setUserProfile(savedProf ? JSON.parse(savedProf) : DEMO_USER_PROFILE);

        const savedSett = localStorage.getItem('saathi_settings_demo');
        setSettings(savedSett ? JSON.parse(savedSett) : DEMO_SETTINGS);

        const savedRems = localStorage.getItem('saathi_reminders_demo');
        setReminders(savedRems ? JSON.parse(savedRems) : DEMO_REMINDERS);

        const savedSaf = localStorage.getItem('saathi_safety_demo');
        setSafetyChecks(savedSaf ? JSON.parse(savedSaf) : INITIAL_SAFETY_CHECKS);

        setIsOnboardingOpen(false);
      } else {
        const savedProf = localStorage.getItem(`saathi_profile_${sessionId}`);
        const parsedProf = savedProf ? JSON.parse(savedProf) : createDefaultVisitorProfile(sessionId);
        setUserProfile(parsedProf);

        const savedSett = localStorage.getItem(`saathi_settings_${sessionId}`);
        setSettings(savedSett ? JSON.parse(savedSett) : createDefaultVisitorSettings());

        const savedRems = localStorage.getItem(`saathi_reminders_${sessionId}`);
        setReminders(savedRems ? JSON.parse(savedRems) : []);

        const savedSaf = localStorage.getItem(`saathi_safety_${sessionId}`);
        setSafetyChecks(savedSaf ? JSON.parse(savedSaf) : []);

        if (!parsedProf.isOnboarded) {
          setIsOnboardingOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error syncing state across namespaces:', e);
    }
  }, [isDemoMode, sessionId]);

  // Persist User Profile
  useEffect(() => {
    try {
      const key = `saathi_profile_${isDemoMode ? 'demo' : sessionId}`;
      localStorage.setItem(key, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Error saving user profile:', e);
    }
  }, [userProfile, isDemoMode, sessionId]);

  // Persist Settings
  useEffect(() => {
    try {
      const key = `saathi_settings_${isDemoMode ? 'demo' : sessionId}`;
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings:', e);
    }
  }, [settings, isDemoMode, sessionId]);

  // Persist Reminders
  useEffect(() => {
    try {
      const key = `saathi_reminders_${isDemoMode ? 'demo' : sessionId}`;
      localStorage.setItem(key, JSON.stringify(reminders));
    } catch (e) {
      console.warn('Error saving reminders:', e);
    }
  }, [reminders, isDemoMode, sessionId]);

  // Persist Family Notifications
  useEffect(() => {
    try {
      const key = `saathi_family_${isDemoMode ? 'demo' : sessionId}`;
      localStorage.setItem(key, JSON.stringify(familyNotifications));
    } catch (e) {
      console.warn('Error saving family notifications:', e);
    }
  }, [familyNotifications, isDemoMode, sessionId]);

  // Persist Safety Checks
  useEffect(() => {
    try {
      const key = `saathi_safety_${isDemoMode ? 'demo' : sessionId}`;
      localStorage.setItem(key, JSON.stringify(safetyChecks));
    } catch (e) {
      console.warn('Error saving safety checks:', e);
    }
  }, [safetyChecks, isDemoMode, sessionId]);

  const setActiveTab = (tab: 'home' | 'explain' | 'safety' | 'reminders' | 'settings') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const query = isDemoMode ? '?mode=demo' : '';
      const newPath = tab === 'home' ? `/${query}` : `/${tab}${query}`;
      window.history.pushState(null, '', newPath);
    }
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'Demo Mode Active: Deterministic Test Persona (Mr. Sharma)'
          : 'Personalized Visitor Mode: Clean isolated session active'
      );
      if (typeof window !== 'undefined') {
        const query = next ? '?mode=demo' : '';
        const newPath = activeTab === 'home' ? `/${query}` : `/${activeTab}${query}`;
        window.history.pushState(null, '', newPath);
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Complete Onboarding
  const completeOnboarding = (data: {
    displayName: string;
    trustedContactName?: string;
    trustedContactRelation?: string;
    trustedContactPhone?: string;
  }) => {
    const updatedProf: UserProfile = {
      ...userProfile,
      displayName: data.displayName,
      trustedContactName: data.trustedContactName || '',
      trustedContactRelation: data.trustedContactRelation || '',
      trustedContactPhone: data.trustedContactPhone || '',
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updatedProf);
    setSettings((prev) => ({
      ...prev,
      userName: data.displayName,
      trustedContactName: data.trustedContactName || '',
      trustedContactRelation: data.trustedContactRelation || '',
      trustedContactPhone: data.trustedContactPhone || '',
    }));

    showToast(
      data.displayName
        ? settings.language === 'hi'
          ? `नमस्ते ${data.displayName}! साथी में आपका स्वागत है।`
          : `Welcome to SAATHI, ${data.displayName}!`
        : settings.language === 'hi'
        ? 'साथी में आपका स्वागत है!'
        : 'Welcome to SAATHI!'
    );
  };

  // Update profile
  const updateUserProfile = (partial: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
      if (partial.displayName !== undefined) {
        setSettings((s) => ({ ...s, userName: partial.displayName || '' }));
      }
      if (partial.trustedContactName !== undefined) {
        setSettings((s) => ({ ...s, trustedContactName: partial.trustedContactName || '' }));
      }
      if (partial.trustedContactRelation !== undefined) {
        setSettings((s) => ({ ...s, trustedContactRelation: partial.trustedContactRelation || '' }));
      }
      if (partial.trustedContactPhone !== undefined) {
        setSettings((s) => ({ ...s, trustedContactPhone: partial.trustedContactPhone || '' }));
      }
      return next;
    });
  };

  // Switch session (for automated testing or session switching)
  const switchSession = (newSessionId: string) => {
    setSessionId(newSessionId);
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, newSessionId);
    } catch (e) {
      console.warn('Failed to set active session ID:', e);
    }
  };

  // Reset Session Data (Safe user-specific reset)
  const resetSessionData = () => {
    try {
      localStorage.removeItem(`saathi_profile_${sessionId}`);
      localStorage.removeItem(`saathi_reminders_${sessionId}`);
      localStorage.removeItem(`saathi_settings_${sessionId}`);
      localStorage.removeItem(`saathi_family_${sessionId}`);
      localStorage.removeItem(`saathi_safety_${sessionId}`);

      const freshSessionId = generateSessionId();
      setSessionId(freshSessionId);
      localStorage.setItem(ACTIVE_SESSION_KEY, freshSessionId);

      setUserProfile(createDefaultVisitorProfile(freshSessionId));
      setSettings(createDefaultVisitorSettings());
      setReminders([]);
      setFamilyNotifications([]);
      setSafetyChecks([]);
      setIsOnboardingOpen(true);

      showToast(
        settings.language === 'hi'
          ? 'सत्र डेटा साफ़ कर दिया गया। नया सत्र आरंभ हुआ।'
          : 'Your session data has been reset.'
      );
    } catch (e) {
      console.warn('Failed to reset session data:', e);
    }
  };

  // Add Reminder
  const addReminder = (data: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
    const newRem: Reminder = {
      ...data,
      id: `rem-${Date.now()}`,
      userId: userProfile.userId,
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
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.userName !== undefined) {
        setUserProfile((p) => ({ ...p, displayName: partial.userName || '' }));
      }
      if (partial.trustedContactName !== undefined) {
        setUserProfile((p) => ({ ...p, trustedContactName: partial.trustedContactName || '' }));
      }
      if (partial.trustedContactRelation !== undefined) {
        setUserProfile((p) => ({ ...p, trustedContactRelation: partial.trustedContactRelation || '' }));
      }
      if (partial.trustedContactPhone !== undefined) {
        setUserProfile((p) => ({ ...p, trustedContactPhone: partial.trustedContactPhone || '' }));
      }
      return next;
    });
  };

  const openTalkWithPrompt = (prompt: string) => {
    setTalkInitialQuery(prompt);
    setIsTalkModalOpen(true);
  };

  const notifyFamily = (event: {
    message: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => {
    const contactLabel = userProfile.trustedContactName
      ? `${userProfile.trustedContactName}${
          userProfile.trustedContactRelation ? ` (${userProfile.trustedContactRelation})` : ''
        }`
      : 'Trusted Contact';

    const newEvent: FamilyNotificationEvent = {
      id: `fam-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      message: event.message,
      riskLevel: event.riskLevel,
      contactName: contactLabel,
      status: 'SENT_SIMULATED',
    };
    setFamilyNotifications((prev) => [newEvent, ...prev]);
    showToast(
      settings.language === 'hi'
        ? `परिवार को सूचित किया गया: ${contactLabel}`
        : `Family member notified: ${contactLabel}`
    );
    return newEvent;
  };

  const addSafetyCheckRecord = (
    record: Omit<SafetyCheckRecord, 'id' | 'timestamp'>
  ) => {
    const newRecord: SafetyCheckRecord = {
      ...record,
      id: `sc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSafetyChecks((prev) => [newRecord, ...prev.slice(0, 9)]);
  };

  const resetDemoData = () => {
    if (isDemoMode) {
      setReminders(DEMO_REMINDERS);
      setSettings(DEMO_SETTINGS);
      setUserProfile(DEMO_USER_PROFILE);
      setFamilyNotifications([]);
      setSafetyChecks(INITIAL_SAFETY_CHECKS);
      localStorage.removeItem('saathi_reminders_demo');
      localStorage.removeItem('saathi_settings_demo');
      localStorage.removeItem('saathi_profile_demo');
      localStorage.removeItem('saathi_family_demo');
      localStorage.removeItem('saathi_safety_demo');
      showToast('Demo data reset to original state.');
    } else {
      resetSessionData();
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sessionId,
        userProfile,
        updateUserProfile,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        resetSessionData,
        switchSession,
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
        safetyChecks,
        addSafetyCheckRecord,
        resetDemoData,
        toastMessage,
        showToast,
        explainPreloadText,
        setExplainPreloadText,
        safetyPreloadText,
        setSafetyPreloadText,
        isDemoMode,
        setIsDemoMode,
        toggleDemoMode,
        isDiagnosticsOpen,
        setIsDiagnosticsOpen,
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
