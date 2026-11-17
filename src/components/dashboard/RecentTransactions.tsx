import React from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, Category } from '../../types';
import { formatAmount, formatDate } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { ChevronRight, PlusCircle, Receipt } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categoriesMap: Record<string, Category>;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categoriesMap,
}) => {
  const { lang, currencySymbol, t, setActiveTab, setEditingTransaction, setIsAddModalOpen } = useApp();

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          {t.dashboard.recentTransactions}
        </h3>
        <button
          onClick={() => setActiveTab('transactions')}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5"
        >
          {t.dashboard.viewAll}
          <ChevronRight size={14} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
            <Receipt size={24} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.dashboard.noRecentTransactions}
          </p>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle size={15} />
            {t.dashboard.quickAddPrompt}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {transactions.slice(0, 5).map((tx) => {
            const cat = categoriesMap[tx.categoryId];
            const catName = lang === 'bn' ? cat?.nameBn || 'অন্যান্য' : cat?.nameEn || 'Other';
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id}
                onClick={() => handleEdit(tx)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 -mx-2 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={cat?.icon || 'MoreHorizontal'}
                    color={cat?.color || '#10B981'}
                    size={18}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {catName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{formatDate(tx.date, lang)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-medium tracking-wider">
                        {tx.paymentMethod}
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[100px] text-slate-500 dark:text-slate-400 italic">
                            {tx.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span
                    className={`text-sm font-bold block ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatAmount(tx.amount, currencySymbol, lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
