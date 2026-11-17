import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, ReceiptText, Plus, HandCoins, BarChart3 } from 'lucide-react';
import { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddModalOpen, setEditingTransaction, t } = useApp();

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'dashboard',
      label: t.nav.home,
      icon: <LayoutDashboard size={20} />,
    },
    {
      tab: 'transactions',
      label: t.nav.transactions,
      icon: <ReceiptText size={20} />,
    },
    {
      tab: 'debts',
      label: t.nav.debts,
      icon: <HandCoins size={20} />,
    },
    {
      tab: 'reports',
      label: t.nav.reports,
      icon: <BarChart3 size={20} />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors pb-safe">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Left Two Tabs */}
        <div className="flex items-center space-x-1 flex-1 justify-around">
          {navItems.slice(0, 2).map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[11px] mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Raised FAB Button */}
        <div className="relative -top-5 px-2">
          <button
            onClick={handleOpenAdd}
            aria-label="Add Transaction"
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Two Tabs */}
        <div className="flex items-center space-x-1 flex-1 justify-around">
          {navItems.slice(2, 4).map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[11px] mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
