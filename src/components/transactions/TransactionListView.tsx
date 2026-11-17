import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, Category, TransactionType } from '../../types';
import { formatAmount, formatDate } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { Search, Filter, Calendar, X, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionListViewProps {
  transactions: Transaction[];
  categories: Category[];
  categoriesMap: Record<string, Category>;
}

type TimeFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH';

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  transactions,
  categories,
  categoriesMap,
}) => {
  const { lang, currencySymbol, t, setEditingTransaction, setIsAddModalOpen } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && tx.categoryId !== selectedCategory) return false;

      // Time filter
      const txTime = new Date(tx.date).getTime();
      if (timeFilter === 'TODAY' && txTime < todayStart) return false;
      if (timeFilter === 'YESTERDAY' && (txTime < yesterdayStart || txTime >= todayStart)) return false;
      if (timeFilter === 'THIS_WEEK' && txTime < weekStart) return false;
      if (timeFilter === 'THIS_MONTH' && txTime < monthStart) return false;

      // Search query (note, category name, amount)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cat = categoriesMap[tx.categoryId];
        const matchNote = tx.note?.toLowerCase().includes(query);
        const matchAmount = tx.amount.toString().includes(query);
        const matchCat =
          cat?.nameBn.toLowerCase().includes(query) || cat?.nameEn.toLowerCase().includes(query);
        if (!matchNote && !matchAmount && !matchCat) return false;
      }

      return true;
    });
  }, [transactions, selectedType, selectedCategory, timeFilter, searchQuery, categoriesMap]);

  // Aggregate totals for the filtered list
  const { filteredIncome, filteredExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') inc += tx.amount;
      if (tx.type === 'EXPENSE') exp += tx.amount;
    });
    return { filteredIncome: inc, filteredExpense: exp };
  }, [filteredTransactions]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-3.5 pb-20">
      {/* Search Input Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t.transaction.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Chips (Time & Type) */}
      <div className="space-y-2">
        {/* Time Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
          {(['ALL', 'TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH'] as TimeFilter[]).map((tf) => {
            const isSelected = timeFilter === tf;
            let label = t.transaction.filterAll;
            if (tf === 'TODAY') label = t.transaction.filterToday;
            if (tf === 'YESTERDAY') label = t.transaction.filterYesterday;
            if (tf === 'THIS_WEEK') label = t.transaction.filterThisWeek;
            if (tf === 'THIS_MONTH') label = t.transaction.filterThisMonth;

            return (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`py-1 px-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Type Filters & Category Dropdown */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => {
              const isSelected = selectedType === type;
              let label = t.transaction.allTypes;
              if (type === 'EXPENSE') label = t.transaction.expense;
              if (type === 'INCOME') label = t.transaction.income;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                    isSelected
                      ? type === 'EXPENSE'
                        ? 'bg-rose-500 text-white'
                        : type === 'INCOME'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Category Filter Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-semibold focus:outline-none shadow-sm"
          >
            <option value="ALL">{t.transaction.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'bn' ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Summary Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
        <span>{filteredTransactions.length} {lang === 'bn' ? 'টি লেনদেন' : 'records'}</span>
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            +{formatAmount(filteredIncome, currencySymbol, lang)}
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-bold">
            -{formatAmount(filteredExpense, currencySymbol, lang)}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Filter size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.transaction.noTransactionsFound}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
          {filteredTransactions.map((tx) => {
            const cat = categoriesMap[tx.categoryId];
            const catName = lang === 'bn' ? cat?.nameBn || 'অন্যান্য' : cat?.nameEn || 'Other';
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id}
                onClick={() => handleEdit(tx)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={cat?.icon || 'MoreHorizontal'}
                    color={cat?.color || '#10B981'}
                    size={20}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {catName}
                      </p>
                      {tx.receiptImage && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium">
                          {lang === 'bn' ? 'রসিদ' : 'Receipt'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      <span>{formatDate(tx.date, lang)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-semibold tracking-wider">
                        {tx.paymentMethod}
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] text-slate-600 dark:text-slate-400 italic">
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
