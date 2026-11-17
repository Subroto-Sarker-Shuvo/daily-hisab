import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, Category, DebtRecord } from '../../types';
import { formatAmount, toBengaliDigits } from '../../lib/formatters';
import { exportToPdf } from '../../lib/pdfGenerator';
import { exportToExcel } from '../../lib/excelExporter';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { FileSpreadsheet, FileText, TrendingUp, ArrowDownLeft, ArrowUpRight, BarChart2 } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  debts: DebtRecord[];
  categories: Category[];
  categoriesMap: Record<string, Category>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  debts,
  categories,
  categoriesMap,
}) => {
  const { lang, currencySymbol, t } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Filter transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Totals
  const { totalIncome, totalExpense, netSavings } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    monthlyTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') inc += tx.amount;
      if (tx.type === 'EXPENSE') exp += tx.amount;
    });
    return { totalIncome: inc, totalExpense: exp, netSavings: inc - exp };
  }, [monthlyTransactions]);

  // Category breakdown for Pie Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categoriesMap[catId];
        return {
          id: catId,
          name: lang === 'bn' ? cat?.nameBn || 'অন্যান্য' : cat?.nameEn || 'Other',
          amount,
          color: cat?.color || '#10B981',
          icon: cat?.icon || 'MoreHorizontal',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions, categoriesMap, lang]);

  // Bar chart data (Income vs Expense)
  const barData = [
    { name: lang === 'bn' ? 'আয়' : 'Income', amount: totalIncome, fill: '#10B981' },
    { name: lang === 'bn' ? 'ব্যয়' : 'Expense', amount: totalExpense, fill: '#F43F5E' },
  ];

  const handleExportPdf = () => {
    exportToPdf(
      monthlyTransactions,
      categoriesMap,
      totalIncome,
      totalExpense,
      currencySymbol,
      lang
    );
  };

  const handleExportExcel = () => {
    exportToExcel(monthlyTransactions, debts, categoriesMap, lang);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Month Picker & Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <BarChart2 size={18} className="text-emerald-500" />
          {t.reports.title}
        </h3>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">{t.reports.totalEarned}</span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
            {formatAmount(totalIncome, currencySymbol, lang)}
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">{t.reports.totalSpent}</span>
          <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-1 block truncate">
            {formatAmount(totalExpense, currencySymbol, lang)}
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">{t.reports.netSavings}</span>
          <span
            className={`text-xs sm:text-sm font-extrabold mt-1 block truncate ${
              netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatAmount(netSavings, currencySymbol, lang)}
          </span>
        </div>
      </div>

      {/* Category Expense Donut Chart */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 mb-3">
          {t.reports.categoryBreakdown}
        </h4>

        {categoryData.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            {t.reports.noDataForReport}
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [formatAmount(val, currencySymbol, lang), '']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Spending Categories List */}
        {categoryData.length > 0 && (
          <div className="mt-3 space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {categoryData.slice(0, 4).map((cat) => {
              const percentage = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
              return (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={15} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({lang === 'bn' ? `${toBengaliDigits(percentage)}%` : `${percentage}%`})
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {formatAmount(cat.amount, currencySymbol, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income vs Expense Bar Comparison */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 mb-2">
          {t.reports.trendComparison}
        </h4>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [formatAmount(val, currencySymbol, lang), '']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleExportPdf}
          disabled={monthlyTransactions.length === 0}
          className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <FileText size={16} className="text-rose-500" />
          {t.reports.exportPdf}
        </button>

        <button
          onClick={handleExportExcel}
          disabled={monthlyTransactions.length === 0 && debts.length === 0}
          className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <FileSpreadsheet size={16} className="text-emerald-500" />
          {t.reports.exportExcel}
        </button>
      </div>
    </div>
  );
};
