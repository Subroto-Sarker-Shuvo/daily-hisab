import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { useApp } from './context/AppContext';
import { Category, Cashbook } from './types';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { BalanceCards } from './components/dashboard/BalanceCards';
import { BudgetProgress } from './components/dashboard/BudgetProgress';
import { RecentTransactions } from './components/dashboard/RecentTransactions';
import { TransactionListView } from './components/transactions/TransactionListView';
import { DebtsView } from './components/debts/DebtsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { AuthModal } from './components/auth/AuthModal';
import { KhataSelectorModal } from './components/cashbooks/KhataSelectorModal';

export const App: React.FC = () => {
  const {
    isPinLocked,
    activeTab,
    currentBookId,
    isKhataModalOpen,
    setIsKhataModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useApp();

  // Reactive Live Subscriptions from Dexie IndexedDB with safe fallbacks
  const allTransactions =
    useLiveQuery(async () => {
      try {
        return await db.transactions.orderBy('date').reverse().toArray();
      } catch (e) {
        console.warn('Transactions fallback query:', e);
        return await db.transactions.toArray();
      }
    }) || [];

  const categories =
    useLiveQuery(async () => {
      try {
        return await db.categories.toArray();
      } catch (e) {
        console.warn('Categories fallback query:', e);
        return [];
      }
    }) || [];

  const allDebts =
    useLiveQuery(async () => {
      try {
        return await db.debts.toArray();
      } catch (e) {
        console.warn('Debts fallback query:', e);
        return [];
      }
    }) || [];

  const cashbooks =
    useLiveQuery(async () => {
      try {
        return await db.cashbooks.toArray();
      } catch (e) {
        console.warn('Cashbooks fallback query:', e);
        return [];
      }
    }) || [];

  // Filter transactions by active Cashbook / Khata
  const transactions = useMemo(() => {
    if (currentBookId === 'all') return allTransactions;
    return allTransactions.filter(
      (t) => t.bookId === currentBookId || (!t.bookId && currentBookId === 'default_personal')
    );
  }, [allTransactions, currentBookId]);

  // Filter debts by active Cashbook / Khata
  const debts = useMemo(() => {
    if (currentBookId === 'all') return allDebts;
    return allDebts.filter(
      (d) => d.bookId === currentBookId || (!d.bookId && currentBookId === 'default_personal')
    );
  }, [allDebts, currentBookId]);

  // Map category IDs for instant O(1) lookup
  const categoriesMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  // Overall Financial Calculations for active Khata
  const {
    todayIncome,
    todayExpense,
    totalIncome,
    totalExpense,
    netBalance,
    monthlyExpense,
    totalPabo,
    totalDibo,
  } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    let tInc = 0;
    let tExp = 0;
    let allInc = 0;
    let allExp = 0;
    let mExp = 0;

    transactions.forEach((tx) => {
      const txDay = tx.date.slice(0, 10);
      const txMonth = tx.date.slice(0, 7);

      if (tx.type === 'INCOME') {
        allInc += tx.amount;
        if (txDay === todayStr) tInc += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        allExp += tx.amount;
        if (txDay === todayStr) tExp += tx.amount;
        if (txMonth === monthStr) mExp += tx.amount;
      }
    });

    const pabo = debts
      .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'SETTLED')
      .reduce((acc, curr) => acc + (curr.totalAmount - curr.settledAmount), 0);

    const dibo = debts
      .filter((d) => d.type === 'PAYABLE' && d.status !== 'SETTLED')
      .reduce((acc, curr) => acc + (curr.totalAmount - curr.settledAmount), 0);

    return {
      todayIncome: tInc,
      todayExpense: tExp,
      totalIncome: allInc,
      totalExpense: allExp,
      netBalance: allInc - allExp,
      monthlyExpense: mExp,
      totalPabo: pabo,
      totalDibo: dibo,
    };
  }, [transactions, debts]);

  // PIN Lock Screen barrier
  if (isPinLocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header with Khata Switcher */}
      <Navbar cashbooks={cashbooks} />

      {/* Main Body */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <BalanceCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netBalance={netBalance}
              totalPabo={totalPabo}
              totalDibo={totalDibo}
            />
            <BudgetProgress monthlyExpense={monthlyExpense} />
            <RecentTransactions
              transactions={transactions}
              categoriesMap={categoriesMap}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionListView
            transactions={transactions}
            categories={categories}
            categoriesMap={categoriesMap}
          />
        )}

        {activeTab === 'debts' && <DebtsView debts={debts} />}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            debts={debts}
            categories={categories}
            categoriesMap={categoriesMap}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal categories={categories} />

      {/* Khata / Cashbook Switcher Modal */}
      <KhataSelectorModal
        cashbooks={cashbooks}
        isOpen={isKhataModalOpen}
        onClose={() => setIsKhataModalOpen(false)}
      />

      {/* Cloud Auth & Login Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};
