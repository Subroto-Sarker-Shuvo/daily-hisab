import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatAmount } from '../../lib/formatters';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, HandCoins } from 'lucide-react';

interface BalanceCardsProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalPabo: number;
  totalDibo: number;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  totalIncome,
  totalExpense,
  netBalance,
  totalPabo,
  totalDibo,
}) => {
  const { currencySymbol, lang, t, setActiveTab } = useApp();

  return (
    <div className="space-y-3.5">
      {/* Primary Net Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-lg shadow-emerald-700/20">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-4 top-4 text-emerald-300/40">
          <TrendingUp size={48} strokeWidth={1.5} />
        </div>

        <div className="relative z-10">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
            {t.dashboard.netBalance}
          </span>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {formatAmount(netBalance, currencySymbol, lang)}
          </div>
          <p className="mt-1.5 text-xs text-emerald-100/70">
            {lang === 'bn' ? 'চলতি সময়ের হিসাবের নগদ স্থিতি' : 'Available cash balance for the period'}
          </p>
        </div>
      </div>

      {/* Income & Expense Split Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.cashIn}
            </span>
          </div>
          <div className="mt-2.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            +{formatAmount(totalIncome, currencySymbol, lang)}
          </div>
        </div>

        {/* Expense Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.cashOut}
            </span>
          </div>
          <div className="mt-2.5 text-lg font-bold text-rose-600 dark:text-rose-400">
            -{formatAmount(totalExpense, currencySymbol, lang)}
          </div>
        </div>
      </div>

      {/* Dena - Paona Quick summary strip */}
      {(totalPabo > 0 || totalDibo > 0) && (
        <div 
          onClick={() => setActiveTab('debts')}
          className="cursor-pointer rounded-xl bg-slate-100/80 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all text-xs"
        >
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <HandCoins size={16} className="text-amber-500" />
            <span className="font-medium">{lang === 'bn' ? 'বাকি হিসাব:' : 'Debts:'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {lang === 'bn' ? 'পাবো: ' : 'Owed: '}
              {formatAmount(totalPabo, currencySymbol, lang)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {lang === 'bn' ? 'দিতে হবে: ' : 'Payable: '}
              {formatAmount(totalDibo, currencySymbol, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
