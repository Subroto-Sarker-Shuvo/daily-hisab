import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';
import { ActiveTab, Transaction, UserSettings } from '../types';
import { db, defaultSettings, seedDefaultDatabase } from '../db/db';

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
  // Modal states
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
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

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const reloadSettings = async () => {
    try {
      await seedDefaultDatabase();
      const settingsRecord = (await (db.settings as any).get('user_preferences')) as (UserSettings & { key: string }) | undefined;
      if (settingsRecord) {
        setLangState(settingsRecord.language || 'bn');
        setCurrencySymbolState(settingsRecord.currencySymbol || '৳');
        setMonthlyBudgetState(settingsRecord.monthlyBudgetLimit || 25000);
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

  useEffect(() => {
    reloadSettings();
  }, []);

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
        isAddModalOpen,
        setIsAddModalOpen,
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
