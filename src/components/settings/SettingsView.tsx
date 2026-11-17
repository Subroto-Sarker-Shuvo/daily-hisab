import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, seedDefaultDatabase } from '../../db/db';
import { hashPin, verifyPin } from '../../lib/crypto';
import {
  Globe,
  Coins,
  Target,
  Shield,
  Download,
  Upload,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    lang,
    setLang,
    currencySymbol,
    setCurrencySymbol,
    monthlyBudget,
    setMonthlyBudget,
    hasPinConfigured,
    setHasPinConfigured,
    reloadSettings,
    t,
  } = useApp();

  const [budgetInput, setBudgetInput] = useState<string>(monthlyBudget.toString());
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinMode, setPinMode] = useState<'SET' | 'DISABLE'>('SET');
  const [inputPin, setInputPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const currencies = [
    { symbol: '৳', label: 'BDT (৳) - বাংলাদেশ' },
    { symbol: '$', label: 'USD ($) - US Dollar' },
    { symbol: '€', label: 'EUR (€) - Euro' },
    { symbol: '₹', label: 'INR (₹) - Indian Rupee' },
    { symbol: '£', label: 'GBP (£) - British Pound' },
    { symbol: 'AED', label: 'AED (د.إ) - Dirham' },
  ];

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val);
      alert(t.common.success);
    }
  };

  // PIN Actions
  const handleOpenSetPin = () => {
    setPinMode('SET');
    setInputPin('');
    setConfirmPin('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleOpenDisablePin = () => {
    setPinMode('DISABLE');
    setInputPin('');
    setConfirmPin('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinMode === 'SET') {
      if (inputPin.length !== 4) {
        setPinError(lang === 'bn' ? 'পিন অবশ্যই ৪ সংখ্যার হতে হবে।' : 'PIN must be exactly 4 digits.');
        return;
      }
      if (inputPin !== confirmPin) {
        setPinError(t.pin.pinMismatch);
        return;
      }

      const hashed = await hashPin(inputPin);
      await (db.settings as any).update('user_preferences', {
        isPinEnabled: true,
        pinHash: hashed,
      });
      setHasPinConfigured(true);
      setIsPinModalOpen(false);
      alert(t.pin.pinSuccess);
    } else {
      // Disable PIN: Verify old PIN first
      const settings = (await (db.settings as any).get('user_preferences')) as any;
      if (!settings?.pinHash) return;

      const isValid = await verifyPin(inputPin, settings.pinHash);
      if (!isValid) {
        setPinError(t.pin.wrongPin);
        return;
      }

      await (db.settings as any).update('user_preferences', {
        isPinEnabled: false,
        pinHash: undefined,
      });
      setHasPinConfigured(false);
      setIsPinModalOpen(false);
      alert(lang === 'bn' ? 'পিন সফলভাবে নিষ্ক্রিয় করা হয়েছে।' : 'PIN lock disabled.');
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    const transactions = await db.transactions.toArray();
    const debts = await db.debts.toArray();
    const categories = await db.categories.toArray();
    const settings = await db.settings.toArray();

    const backupData = {
      appName: 'DailyHisab',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { transactions, debts, categories, settings },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DailyHisab_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (!json.appName || !json.data) {
          throw new Error('Invalid backup format');
        }

        if (
          window.confirm(
            lang === 'bn'
              ? 'ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান ডাটার সাথে নতুন ডাটা মার্জ হবে। এগিয়ে যেতে চান?'
              : 'Restoring backup will merge data into your database. Continue?'
          )
        ) {
          if (json.data.transactions) await db.transactions.bulkPut(json.data.transactions);
          if (json.data.debts) await db.debts.bulkPut(json.data.debts);
          if (json.data.categories) await db.categories.bulkPut(json.data.categories);
          if (json.data.settings) await db.settings.bulkPut(json.data.settings);

          await reloadSettings();
          alert(lang === 'bn' ? 'ডাটা সফলভাবে রিস্টোর হয়েছে!' : 'Data restored successfully!');
        }
      } catch (err) {
        alert(lang === 'bn' ? 'ভুল ব্যাকআপ ফাইল!' : 'Invalid backup file!');
      }
    };
    reader.readAsText(file);
  };

  // Clear All Data
  const handleClearAll = async () => {
    if (window.confirm(t.settings.clearConfirm)) {
      if (window.confirm(lang === 'bn' ? 'চূড়ান্ত সতর্কতা: সব ডাটা স্থায়ীভাবে মুছে যাবে!' : 'Final Warning: All data will be permanently wiped!')) {
        await db.transactions.clear();
        await db.debts.clear();
        await seedDefaultDatabase();
        alert(lang === 'bn' ? 'সকল তথ্য মুছে ফেলা হয়েছে।' : 'All data wiped.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
        {t.settings.title}
      </h3>

      {/* Language Setting */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-emerald-500" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {t.settings.language}
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLang('bn')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              lang === 'bn'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            বাংলা (Bengali)
          </button>
          <button
            onClick={() => setLang('en')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              lang === 'en'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Currency Setting */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-emerald-500" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {t.settings.currency}
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currencies.map((curr) => {
            const isSelected = currencySymbol === curr.symbol;
            return (
              <button
                key={curr.symbol}
                onClick={() => setCurrencySymbol(curr.symbol)}
                className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border text-left truncate transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {curr.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Budget Setting */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-emerald-500" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {t.settings.budget}
          </h4>
        </div>
        <p className="text-[11px] text-slate-400">{t.settings.budgetHint}</p>
        <form onSubmit={handleSaveBudget} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-700"
          >
            {lang === 'bn' ? 'সেভ করুন' : 'Save'}
          </button>
        </form>
      </div>

      {/* Security & PIN Lock */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-emerald-500" />
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {t.settings.pinLock}
              </h4>
              <p className="text-[10px] text-slate-400">
                {hasPinConfigured
                  ? lang === 'bn'
                    ? 'অ্যাপ লক সক্রিয় আছে'
                    : 'App Lock is Active'
                  : lang === 'bn'
                  ? 'অ্যাপ লক নিষ্ক্রিয়'
                  : 'App Lock Disabled'}
              </p>
            </div>
          </div>

          {hasPinConfigured ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSetPin}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
              >
                {lang === 'bn' ? 'পিন পরিবর্তন' : 'Change'}
              </button>
              <button
                onClick={handleOpenDisablePin}
                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                title="Disable PIN"
              >
                <Unlock size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenSetPin}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Lock size={13} />
              {lang === 'bn' ? 'পিন চালু করুন' : 'Enable PIN'}
            </button>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
          {t.settings.backupRestore}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100"
          >
            <Download size={14} className="text-emerald-500" />
            {t.settings.exportBackup}
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100 cursor-pointer text-center truncate">
            <Upload size={14} className="text-teal-500" />
            <span className="truncate">{t.settings.importBackup}</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 p-4 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
        <h4 className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
          <AlertTriangle size={15} />
          {t.settings.dangerZone}
        </h4>
        <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70">
          {lang === 'bn'
            ? 'সকল লেনদেন ও বাকি হিসাব এক ক্লিকে মুছে নতুন করে শুরু করতে পারেন।'
            : 'Permanently remove all data and reset the application.'}
        </p>
        <button
          onClick={handleClearAll}
          className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <Trash2 size={14} />
          {t.settings.clearAllData}
        </button>
      </div>

      {/* PIN Setup/Disable Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mx-auto mb-3">
              <Lock size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {pinMode === 'SET' ? t.pin.setupTitle : lang === 'bn' ? 'বর্তমান পিন দিন' : 'Enter Current PIN'}
            </h3>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                autoFocus
                placeholder="••••"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[1em] text-2xl font-bold py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              />

              {pinMode === 'SET' && (
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] text-2xl font-bold py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              )}

              {pinError && <p className="text-xs text-rose-500 font-medium">{pinError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  {t.transaction.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  {lang === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
