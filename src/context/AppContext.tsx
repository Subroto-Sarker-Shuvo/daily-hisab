import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';
import { ActiveTab, Transaction, UserSettings, Cashbook, CashbookType } from '../types';
import { db, defaultSettings, seedDefaultDatabase } from '../db/db';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { syncEngine } from '../lib/syncEngine';
import type { User } from '@supabase/supabase-js';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured';

interface AppContextType {
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  t: typeof translations.bn;
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isPinLocked: boolean;
  setIsPinLocked: (locked: boolean) => void;
  hasPinConfigured: boolean;
  setHasPinConfigured: (val: boolean) => void;
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;

  // Multiple Cashbooks / Khatas
  currentBookId: string;
  setCurrentBookId: (id: string) => Promise<void>;
  isKhataModalOpen: boolean;
  setIsKhataModalOpen: (open: boolean) => void;
  addCashbook: (name: string, type: CashbookType, icon?: string, color?: string) => Promise<Cashbook>;
  deleteCashbook: (id: string) => Promise<void>;

  // Cloud & Auth
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  triggerSync: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;

  // Modal states
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  reloadSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<'bn' | 'en'>('bn');
  const [currencySymbol, setCurrencySymbolState] = useState<string>('৳');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(25000);

  // Security / PIN Lock
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean>(false);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);

  // Cashbook / Khata state
  const [currentBookId, setCurrentBookIdState] = useState<string>('default_personal');
  const [isKhataModalOpen, setIsKhataModalOpen] = useState<boolean>(false);

  // Cloud & Auth
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('unconfigured');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    localStorage.getItem('daily_hisab_last_synced')
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const reloadSettings = async () => {
    try {
      await seedDefaultDatabase();
      const settingsRecord = (await (db.settings as any).get('user_preferences')) as (UserSettings & { key: string }) | undefined;
      if (settingsRecord) {
        setLangState(settingsRecord.language || 'bn');
        setCurrencySymbolState(settingsRecord.currencySymbol || '৳');
        setMonthlyBudgetState(settingsRecord.monthlyBudgetLimit || 25000);
        setCurrentBookIdState(settingsRecord.activeBookId || 'default_personal');
        setThemeState(settingsRecord.theme || 'light');
        if (settingsRecord.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        if (settingsRecord.isPinEnabled && settingsRecord.pinHash) {
          setHasPinConfigured(true);
          setIsPinLocked(true);
        } else {
          setHasPinConfigured(false);
          setIsPinLocked(false);
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  // Initialize Supabase & User Auth State
  useEffect(() => {
    reloadSettings();

    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      setSyncStatus('unconfigured');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setSyncStatus('idle');
        triggerSyncForUser(session.user.id);
      } else {
        setSyncStatus('idle');
      }
    });

    // Listen for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setSyncStatus('idle');
        triggerSyncForUser(session.user.id);
      } else {
        setSyncStatus('idle');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setCurrentBookId = async (id: string) => {
    setCurrentBookIdState(id);
    await (db.settings as any).update('user_preferences', { activeBookId: id });
  };

  const addCashbook = async (
    name: string,
    type: CashbookType,
    icon: string = 'Book',
    color: string = '#10B981'
  ): Promise<Cashbook> => {
    const newBook: Cashbook = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      icon,
      color,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.cashbooks.add(newBook);
    await setCurrentBookId(newBook.id);
    return newBook;
  };

  const deleteCashbook = async (id: string) => {
    if (id === 'default_personal') return; // Cannot delete default
    await db.cashbooks.delete(id);
    // Move all transactions and debts in this book to default_personal
    await db.transactions.where('bookId').equals(id).modify({ bookId: 'default_personal' });
    await db.debts.where('bookId').equals(id).modify({ bookId: 'default_personal' });
    await setCurrentBookId('default_personal');
  };

  const triggerSyncForUser = async (userId: string) => {
    setSyncStatus('syncing');
    try {
      const result = await syncEngine.performFullSync(userId);
      if (result.success) {
        setSyncStatus('synced');
        setLastSyncedAt(result.lastSyncedAt || new Date().toISOString());
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
    }
  };

  const triggerSync = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await triggerSyncForUser(user.id);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        error:
          lang === 'bn'
            ? 'সুপাবেস (Supabase) ক্লাউড কনফিগারেশন মিসিং। অনুগ্রহ করে সেটিংস বা মডালে URL ও Key দিন।'
            : 'Supabase configuration missing. Please provide URL and Key.',
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        error:
          lang === 'bn'
            ? 'সুপাবেস (Supabase) ক্লাউড কনফিগারেশন মিসিং। অনুগ্রহ করে সেটিংস বা মডালে URL ও Key দিন।'
            : 'Supabase configuration missing. Please provide URL and Key.',
      };
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: name?.trim() || '',
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        error:
          lang === 'bn'
            ? 'সুপাবেস (Supabase) ক্লাউড কনফিগারেশন মিসিং। অনুগ্রহ করে সেটিংস বা মডালে URL ও Key দিন।'
            : 'Supabase configuration missing. Please provide URL and Key.',
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSyncStatus('idle');
  };

  const setLang = async (newLang: 'bn' | 'en') => {
    setLangState(newLang);
    await (db.settings as any).update('user_preferences', { language: newLang });
  };

  const setCurrencySymbol = async (symbol: string) => {
    setCurrencySymbolState(symbol);
    await (db.settings as any).update('user_preferences', { currencySymbol: symbol });
  };

  const setMonthlyBudget = async (budget: number) => {
    setMonthlyBudgetState(budget);
    await (db.settings as any).update('user_preferences', { monthlyBudgetLimit: budget });
  };

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await (db.settings as any).update('user_preferences', { theme: next });
  };

  const t = translations[lang];

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        currencySymbol,
        setCurrencySymbol,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        isPinLocked,
        setIsPinLocked,
        hasPinConfigured,
        setHasPinConfigured,
        monthlyBudget,
        setMonthlyBudget,
        currentBookId,
        setCurrentBookId,
        isKhataModalOpen,
        setIsKhataModalOpen,
        addCashbook,
        deleteCashbook,
        user,
        syncStatus,
        lastSyncedAt,
        isAuthModalOpen,
        setIsAuthModalOpen,
        triggerSync,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        isAddModalOpen,
        setIsAddModalOpen,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        editingTransaction,
        setEditingTransaction,
        reloadSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
