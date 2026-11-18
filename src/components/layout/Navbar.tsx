import React from 'react';
import { useApp } from '../../context/AppContext';
import { Cashbook } from '../../types';
import {
  Sun,
  Moon,
  Settings,
  Wallet,
  Cloud,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  cashbooks: Cashbook[];
}

export const Navbar: React.FC<NavbarProps> = ({ cashbooks }) => {
  const {
    lang,
    setLang,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    currentBookId,
    setIsKhataModalOpen,
    user,
    syncStatus,
    triggerSync,
    setIsAuthModalOpen,
    t,
  } = useApp();

  const handleCloudClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      triggerSync();
    }
  };

  const activeBook = cashbooks.find((b) => b.id === currentBookId);
  const activeBookName =
    currentBookId === 'all'
      ? lang === 'bn' ? 'সব খাতা' : 'All Khatas'
      : activeBook?.name || (lang === 'bn' ? 'ব্যক্তিগত হিসাব' : 'Personal');

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Khata Switcher */}
        <div className="flex items-center gap-2.5 select-none">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 hover:scale-105 transition-transform cursor-pointer"
          >
            <Wallet size={22} className="stroke-[2.2]" />
          </div>

          <div>
            {/* Khata Switcher Pill */}
            <button
              onClick={() => setIsKhataModalOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
            >
              <h1 className="font-bold text-sm sm:text-base leading-tight text-slate-800 dark:text-slate-100 font-sans tracking-tight max-w-[140px] sm:max-w-[180px] truncate">
                {activeBookName}
              </h1>
              <ChevronDown
                size={14}
                className="text-slate-400 group-hover:text-emerald-600 transition-transform"
              />
            </button>

            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-none pl-1">
              {user
                ? lang === 'bn' ? 'ক্লাউড সিঙ্ক চালু' : 'Cloud Synced'
                : lang === 'bn' ? 'অফলাইন ক্যাশবুক' : 'Offline Cashbook'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Status Button */}
          <button
            onClick={handleCloudClick}
            className={`px-2 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all border ${
              user
                ? syncStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                  : syncStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title={user ? 'Click to Sync' : 'Login for Cloud Sync'}
          >
            {user ? (
              syncStatus === 'syncing' ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-amber-600" />
                  <span className="hidden sm:inline text-[10px]">
                    {lang === 'bn' ? 'সিঙ্ক...' : 'Syncing'}
                  </span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <AlertCircle size={13} className="text-rose-600" />
                  <span className="hidden sm:inline text-[10px]">
                    {lang === 'bn' ? 'এরর' : 'Error'}
                  </span>
                </>
              ) : (
                <>
                  <Cloud size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-[10px]">
                    {lang === 'bn' ? 'সিঙ্কড' : 'Synced'}
                  </span>
                </>
              )
            ) : (
              <>
                <Cloud size={13} />
                <span className="text-[10px] hidden sm:inline">
                  {lang === 'bn' ? 'সিঙ্ক' : 'Sync'}
                </span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-all border border-emerald-200/50 dark:border-emerald-800/50"
            title="Switch Language"
          >
            {lang === 'bn' ? 'EN' : 'বাংলা'}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          {/* Settings Tab trigger */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Settings"
          >
            <Settings size={19} />
          </button>
        </div>
      </div>
    </header>
  );
};
