import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Settings, Wallet } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { lang, setLang, theme, toggleTheme, activeTab, setActiveTab, t } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              {t.appName}
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">
              {lang === 'bn' ? 'অফলাইন হিসাব খাতা' : 'Offline Smart Khata'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-all border border-emerald-200/50 dark:border-emerald-800/50"
            title="Switch Language"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
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
