import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatAmount, toBengaliDigits } from '../../lib/formatters';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BudgetProgressProps {
  monthlyExpense: number;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({ monthlyExpense }) => {
  const { monthlyBudget, currencySymbol, lang, t } = useApp();

  if (!monthlyBudget || monthlyBudget <= 0) return null;

  const percentage = Math.min(Math.round((monthlyExpense / monthlyBudget) * 100), 100);
  const isOverBudget = monthlyExpense > monthlyBudget;
  const isNearBudget = !isOverBudget && percentage >= 80;

  // Bar color based on threshold
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/40';
  let Icon = ShieldCheck;

  if (isOverBudget) {
    progressColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/40';
    Icon = AlertCircle;
  } else if (isNearBudget) {
    progressColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/40';
    Icon = AlertTriangle;
  }

  const remaining = Math.max(0, monthlyBudget - monthlyExpense);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={16} className={isOverBudget ? 'text-rose-500' : isNearBudget ? 'text-amber-500' : 'text-emerald-500'} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.dashboard.budgetStatus}
          </span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {lang === 'bn' ? `${toBengaliDigits(percentage)}%` : `${percentage}%`}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <span>{lang === 'bn' ? 'ব্যয়: ' : 'Spent: '}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatAmount(monthlyExpense, currencySymbol, lang)}
          </span>
        </div>
        <div>
          <span>{lang === 'bn' ? 'বাজেট: ' : 'Budget: '}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatAmount(monthlyBudget, currencySymbol, lang)}
          </span>
        </div>
      </div>

      {/* Warning message if exceeded or near */}
      {isOverBudget && (
        <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          ⚠️ {t.dashboard.budgetExceeded} ({formatAmount(monthlyExpense - monthlyBudget, currencySymbol, lang)})
        </p>
      )}
      {isNearBudget && (
        <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          ⚠️ {t.dashboard.budgetNear} - {lang === 'bn' ? 'অবশিষ্ট আছে ' : 'Remaining '}{formatAmount(remaining, currencySymbol, lang)}
        </p>
      )}
    </div>
  );
};
